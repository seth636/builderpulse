import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const GHL_BASE = 'https://services.leadconnectorhq.com';

async function ghlFetch(path: string, locationId?: string): Promise<any> {
  const apiKey = process.env.GHL_API_KEY;
  if (!apiKey) throw new Error('GHL_API_KEY not set');

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    Version: '2021-07-28',
    'Content-Type': 'application/json',
  };
  if (locationId) {
    headers['Location-Id'] = locationId;
  }

  const res = await fetch(`${GHL_BASE}${path}`, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any)?.message || `GHL API HTTP ${res.status}`);
  }
  return res.json();
}

export async function pullGHLData(
  clientId: number,
  locationId: string,
  startDate: string,
  endDate: string
): Promise<{ success: boolean; leadsInserted: number; appointmentsInserted: number; error?: string }> {
  const apiKey = process.env.GHL_API_KEY;
  if (!apiKey) {
    return { success: false, leadsInserted: 0, appointmentsInserted: 0, error: 'GHL_API_KEY not set' };
  }

  let leadsInserted = 0;
  let appointmentsInserted = 0;

  try {
    // Pull contacts (leads)
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime() + 86400000;

    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const data = await ghlFetch(
        `/contacts/?locationId=${locationId}&startAfter=${startMs}&startAfterId=&limit=100&query=`,
        locationId
      ).catch(() => ({ contacts: [] }));

      const contacts: any[] = data.contacts || [];
      if (contacts.length === 0) break;

      for (const contact of contacts) {
        const createdDate = new Date(contact.dateAdded || contact.createdAt || Date.now());
        if (createdDate.getTime() > endMs) continue;

        const existing = await prisma.ghlLead.findFirst({
          where: { client_id: clientId, contact_id: contact.id },
        });

        const leadData = {
          client_id: clientId,
          contact_id: contact.id,
          name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown',
          email: contact.email || null,
          phone: contact.phone || null,
          source: contact.source || contact.attributionSource?.medium || null,
          status: contact.contactStage?.name || contact.status || 'new',
          created_date: createdDate,
        };

        if (existing) {
          await prisma.ghlLead.update({ where: { id: existing.id }, data: leadData });
        } else {
          await prisma.ghlLead.create({ data: leadData });
          leadsInserted++;
        }
      }

      hasMore = contacts.length === 100;
      page++;
      if (page > 20) break; // safety cap
    }

    // Pull appointments
    const apptData = await ghlFetch(
      `/calendars/events?locationId=${locationId}&startTime=${startMs}&endTime=${endMs}&includeAll=true`,
      locationId
    ).catch(() => ({ events: [] }));

    const events: any[] = apptData.events || apptData.data || [];

    for (const event of events) {
      const existing = await prisma.ghlAppointment.findFirst({
        where: { client_id: clientId, appointment_id: event.id },
      });

      const apptData2 = {
        client_id: clientId,
        appointment_id: event.id,
        contact_name: event.title || event.contactName || null,
        calendar_name: event.calendarId || event.calendar?.name || null,
        appointment_date: new Date(event.startTime || event.start || Date.now()),
        status: event.status || event.appointmentStatus || null,
      };

      if (existing) {
        await prisma.ghlAppointment.update({ where: { id: existing.id }, data: apptData2 });
      } else {
        await prisma.ghlAppointment.create({ data: apptData2 });
        appointmentsInserted++;
      }
    }

    return { success: true, leadsInserted, appointmentsInserted };
  } catch (err: any) {
    return { success: false, leadsInserted, appointmentsInserted, error: err?.message || 'Unknown error' };
  }
}
