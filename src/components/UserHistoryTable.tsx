import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { IParsedPassportData } from '../types/passport';
import { utils, writeFile } from 'xlsx';

import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const UserHistoryTable: React.FC = () => {
    const [passportData, setPassportData] = useState<IParsedPassportData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const { token } = useAuth();
    const navigate = useNavigate();

    function parseDate(dateStr: string): Date {
      const dateMatch = dateStr.match(/(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})/);
      if(dateMatch){
        const day = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10) - 1;
        const year = parseInt(dateMatch[3], 10);
        return new Date(year, month, day);
       } else {
        return new Date(dateStr);
      }
    }

    const checkDuplicateDate = (data: IParsedPassportData[], newEntry: IParsedPassportData): boolean => {
        return data.some(entry => {
            const existingDate = parseDate(entry.Date).toDateString();
            const newDate = parseDate(newEntry.Date).toDateString();
            return existingDate === newDate;
        });
    };

    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get<{ data: IParsedPassportData[] }>(
                    'http://localhost:5000/api/passport/user-history',
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                // Filter out duplicates while maintaining order
                const uniqueData: IParsedPassportData[] = [];
                response.data.data.forEach(entry => {
                    if (!checkDuplicateDate(uniqueData, entry)) {
                        uniqueData.push(entry);
                    } else {
                        toast({
                            description: `Entry for date ${entry.Date} already exists and was skipped.`,
                            variant: "destructive"
                        });
                    }
                });

                const sortedData = uniqueData.sort((a, b) => {
                    const dateA = parseDate(a.Date);
                    const dateB = parseDate(b.Date);
                    return dateA.getTime() - dateB.getTime();
                });

                const updatedData = sortedData.map((entry, index) => ({
                    ...entry,
                    Sl_no: (index + 1).toString()
                }));

                setPassportData(updatedData);
            } catch (error: any) {
                console.error('Error fetching passport history:', error);
                toast({
                    description: "Failed to fetch passport history",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [token]);

    const handleSort = () => {
        const sortedData = [...passportData].sort((a, b) => {
            const dateA = parseDate(a.Date);
            const dateB = parseDate(b.Date);
            return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
        });

        const updatedData = sortedData.map((entry, index) => ({
            ...entry,
            Sl_no: (index + 1).toString()
        }));

        setPassportData(updatedData);
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    };

    const handleExportToExcel = () => {
        if (!passportData || passportData.length === 0) {
            toast({
                description: "No data to export",
                variant: "destructive"
            });
            return;
        }

        const formattedData = passportData.map((entry) => ({
            'Sl No': entry.Sl_no,
            Country: entry.Country,
            'Airport Name with Location': entry.Airport_Name_with_location,
            'Arrival / Departure': entry.Arrival_Departure,
            Date: entry.Date,
            Description: entry.Description,
            //'Is Manual Entry': entry.isManualEntry,
        }));

        const worksheet = utils.json_to_sheet(formattedData);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, 'Passport History');
        writeFile(workbook, 'passport_history.xlsx');
    };

    const handleBack = () => {
        navigate(-1);
    };

    if (isLoading) {
        return <p>Loading passport history...</p>;
    }

    return (
        <div className="p-4">
            <div className="flex gap-4 mb-4">
                <button 
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={handleSort}
                >
                    Sort by Date {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
                <button 
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    onClick={handleBack}
                >
                    Back to Upload
                </button>
                <button 
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    onClick={handleExportToExcel}
                >
                    Export to Excel
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 border-b">Sl No</th>
                            <th className="px-6 py-3 border-b">Country</th>
                            <th className="px-6 py-3 border-b">Airport Name with Location</th>
                            <th className="px-6 py-3 border-b">Arrival / Departure</th>
                            <th className="px-6 py-3 border-b">Date</th>
                            <th className="px-6 py-3 border-b">Description</th>
                            
                        </tr>
                    </thead>
                    <tbody>
                        {passportData.map((entry) => (
                            <tr key={entry._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 border-b">{entry.Sl_no}</td>
                                <td className="px-6 py-4 border-b">{entry.Country}</td>
                                <td className="px-6 py-4 border-b">{entry.Airport_Name_with_location}</td>
                                <td className="px-6 py-4 border-b">{entry.Arrival_Departure}</td>
                                <td className="px-6 py-4 border-b">{entry.Date}</td>
                                <td className="px-6 py-4 border-b">{entry.Description}</td>
                                
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserHistoryTable;