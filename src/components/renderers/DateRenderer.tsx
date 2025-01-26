import Handsontable from 'handsontable';
import moment from 'moment';

function dateRenderer(
  hotInstance: any, 
  TD: HTMLTableCellElement, 
  row: number, 
  col: number, 
  prop: string | number, 
  value: any, 
  cellProperties: any
) {
  // Clear previous styling
  TD.style.backgroundColor = '';
  TD.style.color = '';
  
  // Check if the value is a valid date
  const isValidDate = moment(value, 'DD/MM/YYYY', true).isValid();
  
  if (!isValidDate && value) {
    TD.style.backgroundColor = '#ffebee'; // Light red background
    TD.style.color = '#d32f2f'; // Dark red text
  }
  
  TD.innerHTML = value || '';
}

// Register the renderer
Handsontable.renderers.registerRenderer('dateRenderer', dateRenderer);

export default dateRenderer;