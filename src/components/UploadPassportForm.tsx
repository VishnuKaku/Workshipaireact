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
}

interface ColumnSettings {
    data: string;
     renderer?:  string | ((instance: Core, TD: HTMLTableCellElement, row: number, column: number, prop: string | number, value: any, cellProperties: CellProperties) => void) | undefined
}

const UploadPassportForm: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const hotRef = useRef<HotTableClass | null>(null);
  const { token } = useAuth();
  const navigate = useNavigate();
  const [isDataValid, setIsDataValid] = useState(true);


  // Remove Sl_no from column settings since we'll use rowHeaders
  const columnSettings: ColumnSettings[] = [
     { data: 'Country' },
      { data: 'Airport_Name_with_location' },
       {
         data: 'Arrival_Departure',
         renderer: (instance: Core, td: HTMLTableCellElement, row: number, col: number, prop: string | number, value: any, cellProperties: CellProperties) => {
           const normalizedValue = value ? String(value).toUpperCase() : '';
              if(normalizedValue === 'ARRIVAL'){
                 td.innerHTML = ' <span style="font-size: 20px;">←</span> Arrival';
              } else if (normalizedValue === 'DEPARTURE'){
                 td.innerHTML = 'Departure <span style="font-size: 20px;">→</span>';
               } else {
                   td.innerHTML = value || '';
              }
          }
        },
      { data: 'Date' },
      { data: 'Description' },
  ];

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
      const transformedData = response.data.map((item: any) => ({
        Country: item.Country,
        Airport_Name_with_location: item.Airport_Name_with_location,
        Arrival_Departure: item.Arrival_Departure,
        Date: item.Date,
        Description: item.Description,
        _Sl_no: item.Sl_no // Keep Sl_no as hidden field for reference
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
      const tableData = hotRef.current.__hotInstance.getData();
      const processedData = tableData.map((row: any, index: number) => {
        return [
          (index + 1).toString(), // Sl_no
          row[0], // Country
          row[1], // Airport_Name_with_location
          row[2], // Arrival_Departure
          row[3], // Date
          row[4], // Description
          true, // isManualEntry
        ];
      });

      try {
        const response = await axios.post('http://localhost:5000/api/passport/data', processedData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.status === 200) {
          toast.success('Data saved successfully!');
        }
      } catch (error: any) {
        console.error('Error saving data:', error);
        toast.error(`Error saving data: ${error.response?.data?.message || error.message}`);
      }
    } else {
      console.error('Handsontable instance not available');
    }
};

  const hotTableSettings: CustomHotTableProps = {
    data: tableData,
    colHeaders: columnSettings.map((col) => col.data),
    columns: columnSettings,
    rowHeaders: true,
    licenseKey: "non-commercial-and-evaluation",
    plugins: [ColumnSorting, Filters, ManualRowMove, ManualColumnMove, DropdownMenu, ContextMenu, BasePlugin],
    beforeChange: beforeChange,
  }

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