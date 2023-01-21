import fetch, { RequestInit, HeadersInit } from "node-fetch";
import ObjectsToCsv from "objects-to-csv";
import dayjs from "dayjs";

interface Schedule {
  id: string;
  month: string;
  days: string;
  year: string;
  scheduleDescriptionId: string;
}

interface ScheduleDescription {
  id: string;
  month: string;
  days: string;
  year: string;
  scheduleDescriptionId: string;
  name: string;
  description: string;
  typeId: string;
  color: string;
  order: string;
  notificationType: string;
  notificationText: string;
  notificationDaysBefore: string;
  masterId: string;
  slaveId: string;
}

interface ResultAPI {
  schedules: Schedule[];
  scheduleDescription: ScheduleDescription[];
}

interface CalendarEntry {
  Subject: string;
  "Start Date": string;
  "Start Time"?: string
  "End Date"?: string
  "End Time"?: string
  "All Day Event": "True";
  Description?: string
  Location?: string
  Private?: boolean
}

const myHeaders: HeadersInit = {};
myHeaders["accept"] = "application/json, text/plain, */*";
myHeaders["content-type"] = "application/x-www-form-urlencoded; charset=UTF-8";

const raw = "number=135b&streetId=11609783";

const requestOptions: RequestInit = {
  method: "POST",
  headers: myHeaders,
  body: raw,
  redirect: "follow",
};

fetch(
  "https://pluginssl.ecoharmonogram.pl/api/v1/plugin/v1/schedules",
  requestOptions
)
  .then((response) => {
    return response.text();
  })
  .then((response) => {
    return JSON.parse(response.trim());
  })
  .then((result: ResultAPI) => {
    const mappedSchedules: Record<string, ScheduleDescription> =
      result.scheduleDescription.reduce((list, current) => {
        list[current.id] = current;
        return list;
      }, {} as Record<string, ScheduleDescription>);

    result.schedules.forEach(({ scheduleDescriptionId, days, month, year }) => {
      if (!mappedSchedules[scheduleDescriptionId]) {
        return;
      }

      if (mappedSchedules[scheduleDescriptionId]!.name === "TERMINY PŁATNOŚCI") {
        return;
      }
      days.split(";").forEach((day) => {
        const entry: CalendarEntry = {
          Subject: mappedSchedules[scheduleDescriptionId]!.name,
          "Start Date": dayjs()
            .month(parseInt(month, 10) - 1)
            .date(parseInt(day, 10))
            .set("year", parseInt(year, 10))
            .format("MM/DD/YYYY"),
          "All Day Event": "True",

        };

        calendar.push(entry);
      });
    });

    (async () => {
      const csv = new ObjectsToCsv(calendar);

      // Save to file:
      await csv.toDisk("./wywoz.csv", { bom: true });
    })();
  })
  .catch((error) => console.log("error", error));

const calendar: CalendarEntry[] = [];
