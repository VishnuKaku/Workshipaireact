import React, { useState, useRef } from 'react';
import axios from 'axios';
import 'handsontable/dist/handsontable.full.css';
import { HotTable, HotTableClass } from '@handsontable/react';

const UploadPassportForm: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [tableData, setTableData] = useState<any[]>([]);
    const hotRef = useRef<HotTableClass | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleUpload = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedFile) {
            alert('Please select a file first.');
            return;
        }

        const formData = new FormData();
        formData.append('passportPage', selectedFile);

        try {
            const response = await axios.post('https://4durbmip8r.eu-central-1.awsapprunner.com/api/passport/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            setTableData(response.data);
        } catch (error: any) {
            console.error('Upload failed:', error);
            alert(`Upload failed: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleSave = async () => {
        if (hotRef.current && hotRef.current.__hotInstance) {
            const modifiedData = hotRef.current.__hotInstance.getData();
            try {
                await axios.post('https://4durbmip8r.eu-central-1.awsapprunner.com/api/passport/data', modifiedData);
                alert('Data saved successfully!');
            } catch (error: any) {
                console.error('Error saving data:', error);
                alert(`Error saving data: ${error.message}`);
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
        </div>
    );
};

export default UploadPassportForm;