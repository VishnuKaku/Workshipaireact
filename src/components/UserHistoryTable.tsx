import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { IParsedPassportData } from '../types/passport';
import { utils, writeFile } from 'xlsx';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

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

     useEffect(() => {
        const fetchHistory = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get< { data: IParsedPassportData[] } >(
                    'http://localhost:5000/api/passport/user-history',
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                const sortedData = response.data.data.sort((a, b) => {
                  const dateA = parseDate(a.Date);
                  const dateB = parseDate(b.Date);
                  return dateA.getTime() - dateB.getTime(); // Sort in ascending by default
                });
                const updatedData = sortedData.map((entry, index) => ({
                   ...entry,
                   Sl_no: (index+1).toString()
                 }));
                 console.log('Response Data:', updatedData);
                setPassportData(updatedData);

            } catch (error: any) {
                console.error('Error fetching passport history:', error);
                toast.error('Failed to fetch passport history');
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
            if (sortOrder === 'asc') {
                return dateA.getTime() - dateB.getTime();
            } else {
                return dateB.getTime() - dateA.getTime();
            }
        });
        const updatedData = sortedData.map((entry, index) => ({
                 ...entry,
                 Sl_no: (index+1).toString()
            }));

        setPassportData(updatedData);
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    };

    const handleExportToExcel = () => {
        if (!passportData || passportData.length === 0) {
            toast.warn('No data to export');
            return;
        }

         const formattedData = passportData.map((entry) => ({
             'Sl No': entry.Sl_no,
             Country: entry.Country,
             'Airport Name with Location': entry.Airport_Name_with_location,
             'Arrival / Departure': entry.Arrival_Departure,
             Date: entry.Date,
             Description: entry.Description,
             'Is Manual Entry': entry.isManualEntry,
           }));

         const worksheet = utils.json_to_sheet(formattedData);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, 'Passport History');

        writeFile(workbook, 'passport_history.xlsx');
    };

    if (isLoading) {
        return <p>Loading passport history...</p>;
    }
    const handleBack = () => {
        navigate('/home');
    };

    return (
        <div>
            <button onClick={handleSort}>
                Sort by Date {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
             <button onClick={handleBack}>Back to Upload</button>
            <button onClick={handleExportToExcel}>Export to Excel</button>
            <table>
                <thead>
                    <tr>
                      <th>Sl No</th>
                      <th>Country</th>
                      <th>Airport Name with Location</th>
                      <th>Arrival / Departure</th>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Is Manual Entry</th>
                   </tr>
                </thead>
                <tbody>
                    {passportData.map((entry) => (
                       <tr key={entry._id}>
                          <td>{entry.Sl_no}</td>
                           <td>{entry.Country}</td>
                          <td>{entry.Airport_Name_with_location}</td>
                          <td>{entry.Arrival_Departure}</td>
                          <td>{entry.Date}</td>
                          <td>{entry.Description}</td>
                          <td>{entry.isManualEntry ? 'Yes' : 'No'}</td>
                       </tr>
                   ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserHistoryTable;