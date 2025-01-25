import React, { useState, useRef } from 'react';
import axios from 'axios';
import 'handsontable/dist/handsontable.full.css';
import { HotTable, HotTableClass } from '@handsontable/react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const UploadPassportForm: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [tableData, setTableData] = useState<any[]>([]);
    const hotRef = useRef<HotTableClass | null>(null);
    const { token } = useAuth();
    const navigate = useNavigate();

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
            const response = await axios.post('http://localhost:5000/api/passport/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                     Authorization: `Bearer ${token}`,
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
           setTableData(response.data);
              toast.success('Upload successful!');
        } catch (error: any) {
            console.error('Upload failed:', error);
            toast.error(`Upload failed: ${error.response?.data?.message || error.message}`);
        }
    };
        const handleViewHistory = () => {
        navigate("/history");
        }

    const handleSave = async () => {
        if (hotRef.current && hotRef.current.__hotInstance) {
            const modifiedData = hotRef.current.__hotInstance.getData();
             const processedData = modifiedData.map((entry: any) => {
                    const isManualEntry = entry[6] === undefined ? true : false;
                  return [
                  entry[0], //Sl no
                    entry[1], //country
                    entry[2], //airportName
                    entry[3], // arrival/departure
                    entry[4], // date
                    entry[5], // description
                    isManualEntry, // isManualEntry (type boolean)
                  ];
                })
            try {
                await axios.post('http://localhost:5000/api/passport/data', processedData, {
                     headers: {
                       Authorization: `Bearer ${token}`,
                     },
                });
              toast.success('Data saved successfully!');
            } catch (error: any) {
                console.error('Error saving data:', error);
                 toast.error(`Error saving data: ${error.message}`);
            }
        } else {
            console.error("Handsontable instance not available");
        }
    };

    return (
        <div>
            <form onSubmit={handleUpload}>
                <h2>Upload Passport Page</h2>
                <input type="file" onChange={handleFileChange} accept=".jpg, .jpeg, .png, .pdf" />
                <button type="submit">Upload</button>
            </form>
            {tableData.length > 0 && (
                <div>
                    <h2>Edit Data</h2>
                    <HotTable
                        ref={hotRef}
                        data={tableData}
                        colHeaders={true}
                        rowHeaders={true}
                        licenseKey="non-commercial-and-evaluation"
                    />
                    <button onClick={handleSave}>Save Changes</button>
                </div>
            )}
            <button onClick={handleViewHistory}>View History</button>
        </div>
    );
};

export default UploadPassportForm;