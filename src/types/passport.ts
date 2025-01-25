// types/passport.ts
export interface IParsedPassportData {
    Sl_no: string;
    Country: string;
    Airport_Name_with_location: string;
    Arrival_Departure: string;
    Date: string;
    Description: string;
    isManualEntry?: boolean;
    _id: string;
}
