import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { rater: string } }
) {
  try {
    const { rater } = await params;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(
          /\\n/g,
          "\n"
        ),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Map rater to the corresponding spreadsheet ID
    const spreadsheetMap: Record<string, string | undefined> = {
      "1": process.env.RATER_1_SPREADSHEET_ID,
      "2": process.env.RATER_2_SPREADSHEET_ID,
      "3": process.env.RATER_3_SPREADSHEET_ID,
      "4": process.env.RATER_4_SPREADSHEET_ID,
      "5": process.env.RATER_5_SPREADSHEET_ID,
    };

    const spreadsheetId = spreadsheetMap[rater];
    console.log("spreadsheetId", spreadsheetId);
    if (!spreadsheetId) {
      return NextResponse.json(
        {
          error: "Invalid rater",
          details: "Rater must be a number between 1 and 5",
        },
        { status: 400 }
      );
    }

    // Get metadata to determine the available sheet names
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    console.log("spreadsheet", spreadsheet.data);
    // Use the first available sheet name
    const sheetName = spreadsheet.data.sheets?.[0].properties?.title;
    console.log("sheetName", sheetName);
    if (!sheetName) {
      return NextResponse.json(
        { error: "No sheet found", details: "Could not retrieve sheet name." },
        { status: 500 }
      );
    }

    // Fetch the data with a valid range
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:Z`, // Ensure this range exists in your sheet
    });

    console.log("response", response.data.values);

    return NextResponse.json(response.data.values);
  } catch (error) {
    console.error("Detailed error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data", details: (error as Error).message },
      { status: 500 }
    );
  }
}
