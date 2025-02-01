import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import 'handsontable/dist/handsontable.full.css';
import { HotTable, HotTableClass } from '@handsontable/react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { registerAllModules } from 'handsontable/registry';
import {
    ColumnSorting,
    Filters,
    ManualRowMove,
    ManualColumnMove,
    DropdownMenu,
    ContextMenu,
    BasePlugin,
} from 'handsontable/plugins';
import { HotTableProps } from '@handsontable/react';
import Core from 'handsontable/core';
import { CellProperties } from 'handsontable/settings';

registerAllModules();

interface CustomHotTableProps extends HotTableProps {
    plugins?: (typeof BasePlugin)[];
    columns: any[]
}

interface PassportEntry {
    Sl_no: string;
    Country: string;
    Airport_Name_with_location: string;
    Arrival_Departure: string;
    Date: string;
    Description: string;
    isManualEntry?: boolean;
    confidence?: number;
}

const UploadPassportForm: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [tableData, setTableData] = useState<PassportEntry[]>([]);
    const hotRef = useRef<HotTableClass | null>(null);
    const { token } = useAuth();
    const navigate = useNavigate();
    const [isDataValid, setIsDataValid] = useState(true);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleUpload = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedFile) {
            toast.warn('Please select a file first.');
            return;
        }

        const formData = new FormData();
        formData.append('passportPage', selectedFile);

        try {
            const response = await axios.post(
                'http://localhost:5000/api/passport/upload',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`,
                    },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                }
            );

            // Transform the data to remove Sl_no from visible columns
            const transformedData = response.data.map((item: any, index:number) => ({
                Country: item.Country,
                Airport_Name_with_location: item.Airport_Name_with_location,
                Arrival_Departure: item.Arrival_Departure,
                Date: item.Date,
                Description: item.Description,
                Sl_no: (index + 1).toString(), // Keep Sl_no as hidden field for reference
                isManualEntry: false,
            }));

            setTableData(transformedData);
            toast.success('Upload successful!');
        } catch (error: any) {
            console.error('Upload failed:', error);
            toast.error(
                `Upload failed: ${error.response?.data?.message || error.message}`
            );
        }
    };

    const handleDeleteRow = (rowIndex: number) => {
        const updatedData = tableData.filter((_row: any, index: number) => index !== rowIndex);
        const updatedDataWithSlNo = updatedData.map((row: any, index: number) => {
            return { ...row, Sl_no: (index + 1).toString() }
        });
        setTableData(updatedDataWithSlNo);
    };

    const handleAddRow = () => {
        const newEntry = createEmptyEntry((tableData.length + 1).toString());
        newEntry.isManualEntry = true;
        setTableData([...tableData, newEntry]);
    };

    const handleViewHistory = () => {
        navigate('/history');
    };

    const validateDate = (dateString: string | null): boolean => {
        if (!dateString) return true;
        const date = new Date(dateString.split('/').reverse().join('-'));
        if (isNaN(date.getTime())) return false;
        return date <= new Date();
    };

    const beforeChange = (changes: any[], source: string) => {
        if (source === 'edit') {
            let allValid = true;
            if (changes) {
                changes.forEach(([row, prop, oldValue, newValue]: [number, string, any, any]) => {
                    if (prop === 'Date') {
                        if (!validateDate(newValue)) {
                            allValid = false;
                            setTimeout(() => {
                                if (hotRef.current && hotRef.current.__hotInstance) {
                                    const hotInstance = hotRef.current.__hotInstance;
                                    const cell = hotInstance.getCell(row, hotInstance.propToCol(prop));
                                    if (cell) {
                                        cell.style.backgroundColor = 'red';
                                    }
                                }
                            }, 0);
                        } else {
                            setTimeout(() => {
                                if (hotRef.current && hotRef.current.__hotInstance) {
                                    const hotInstance = hotRef.current.__hotInstance;
                                    const cell = hotInstance.getCell(row, hotInstance.propToCol(prop));
                                    if (cell) {
                                        cell.style.backgroundColor = '';
                                    }
                                }
                            }, 0);
                        }
                    }
                });
                setIsDataValid(allValid);
            }
        }
    };

    useEffect(() => {
        if (tableData && tableData.length > 0 && hotRef.current && hotRef.current.__hotInstance) {
            let allValid = true;
            tableData.forEach((row, rowIndex) => {
                if (row && row.Date) {
                    if (!validateDate(row.Date)) {
                        allValid = false;
                        setTimeout(() => {
                            const hotInstance = hotRef.current?.__hotInstance;
                            if (hotInstance) {
                                const cell = hotInstance.getCell(rowIndex, hotInstance.propToCol('Date'));
                                if (cell) {
                                    cell.style.backgroundColor = 'red';
                                }
                            }
                        }, 0);
                    }
                }
            });
            setIsDataValid(allValid);
        }
    }, [tableData]);

    const handleSave = async () => {
        if (!isDataValid) {
            toast.error('Cannot save data with invalid or future dates.', {
                autoClose: 3000,
            });
            return;
        }
        if (hotRef.current && hotRef.current.__hotInstance) {
            const tableData = hotRef.current.__hotInstance.getData() as any[];
            // Format the data to match the PassportEntry interface
             const processedData = tableData.map((row: any, index: number) => {
                const dateString = row[3] || "";
                let formattedDate = "";
                if (dateString) {
                    const dateParts = dateString.split('/');
                    if (dateParts.length === 3) {
                        formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
                    }
                }

                return {
                    Sl_no: row.Sl_no || (index + 1).toString(),
                    Country: (row[0] || "").trim(),
                    Airport_Name_with_location: (row[1] || "").trim(),
                    Arrival_Departure: (row[2] || "").trim(),
                    Date: formattedDate,
                    Description: (row[4] || "").trim(),
                    isManualEntry: row.isManualEntry
                }
            });
            try {
                const response = await axios.post(
                    'http://localhost:5000/api/passport/data',
                    processedData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                if (response.status === 200) {
                    toast.success('Data saved successfully!');
                }
            } catch (error: any) {
                console.error('Error saving data:', error);
                toast.error(`Error saving data: ${error.response?.data?.message || error.message}`, {
                    autoClose: 3000
                });
            }
        } else {
            console.error('Handsontable instance not available');
        }
    };

    const createEmptyEntry = (slNo: string = '1'): PassportEntry => {
        return {
            Sl_no: slNo,
            Country: '',
            Airport_Name_with_location: '',
            Arrival_Departure: '',
            Date: '',
            Description: '',
            isManualEntry: true,
            confidence: 0,
        };
    }

    const columnSettings: any[] = [
        { data: 'Country' },
        { data: 'Airport_Name_with_location' },
        {
            data: 'Arrival_Departure',
            renderer: (instance: Core, td: HTMLTableCellElement, row: number, col: number, prop: string | number, value: any, cellProperties: CellProperties) => {
                const normalizedValue = value ? String(value).toUpperCase() : '';
                if (normalizedValue === 'ARRIVAL') {
                    td.innerHTML = ' <span style="font-size: 20px;">←</span> Arrival';
                } else if (normalizedValue === 'DEPARTURE') {
                    td.innerHTML = 'Departure <span style="font-size: 20px;">→</span>';
                } else {
                    td.innerHTML = value || '';
                }
            }
        },
        { data: 'Date' },
        { data: 'Description' },
        {
            data: 'actions',
            renderer: function(instance: Core, td: HTMLTableCellElement, row: number, column: number) {
                // Clear any existing content to prevent multiple buttons
                td.innerHTML = '';
                
                // Create delete button
                const button = document.createElement('button');
                button.innerText = 'Delete';
                button.className = 'delete-row-btn';
                button.style.padding = '5px 10px';
                button.style.margin = '0 auto';
                button.style.display = 'block';
                
                // Add click event listener
                button.addEventListener('click', () => {
                    handleDeleteRow(row);
                });
                
                // Append button to cell
                td.appendChild(button);
            },
            // Ensure this column is not editable
            editor: false
        }
    ];

    const hotTableSettings: CustomHotTableProps = {
        data: tableData,
        colHeaders: [...columnSettings.map((col) => col.data), 'Actions'],
        columns: columnSettings,
        rowHeaders: true,
        licenseKey: "non-commercial-and-evaluation",
        plugins: [ColumnSorting, Filters, ManualRowMove, ManualColumnMove, DropdownMenu, ContextMenu],
        beforeChange: beforeChange,
    };

    return (
        <div>
            <form onSubmit={handleUpload}>
                <h2>Upload Passport Page</h2>
                <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".jpg, .jpeg, .png, .pdf"
                />
                <button type="submit">Upload</button>
            </form>
            {tableData.length > 0 && (
                <div>
                    <h2>Edit Data</h2>
                    <button onClick={handleAddRow}>Add Row</button>
                    <HotTable
                        {...hotTableSettings}
                        ref={hotRef}
                    />
                    <button onClick={handleSave}>Save Changes</button>
                </div>
            )}
            <button onClick={handleViewHistory}>View History</button>
        </div>
    );
};

export default UploadPassportForm;