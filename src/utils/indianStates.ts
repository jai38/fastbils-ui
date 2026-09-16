/**
 * Authoritative Indian GST State Codes (Rule 46 & GSTN specifications)
 */
export interface IndianState {
  code: string;
  name: string;
  label: string;
}

export const INDIAN_STATES: IndianState[] = [
  { code: '01', name: 'Jammu and Kashmir', label: '01 - Jammu and Kashmir' },
  { code: '02', name: 'Himachal Pradesh', label: '02 - Himachal Pradesh' },
  { code: '03', name: 'Punjab', label: '03 - Punjab' },
  { code: '04', name: 'Chandigarh', label: '04 - Chandigarh' },
  { code: '05', name: 'Uttarakhand', label: '05 - Uttarakhand' },
  { code: '06', name: 'Haryana', label: '06 - Haryana' },
  { code: '07', name: 'Delhi', label: '07 - Delhi' },
  { code: '08', name: 'Rajasthan', label: '08 - Rajasthan' },
  { code: '09', name: 'Uttar Pradesh', label: '09 - Uttar Pradesh' },
  { code: '10', name: 'Bihar', label: '10 - Bihar' },
  { code: '11', name: 'Sikkim', label: '11 - Sikkim' },
  { code: '12', name: 'Arunachal Pradesh', label: '12 - Arunachal Pradesh' },
  { code: '13', name: 'Nagaland', label: '13 - Nagaland' },
  { code: '14', name: 'Manipur', label: '14 - Manipur' },
  { code: '15', name: 'Mizoram', label: '15 - Mizoram' },
  { code: '16', name: 'Tripura', label: '16 - Tripura' },
  { code: '17', name: 'Meghalaya', label: '17 - Meghalaya' },
  { code: '18', name: 'Assam', label: '18 - Assam' },
  { code: '19', name: 'West Bengal', label: '19 - West Bengal' },
  { code: '20', name: 'Jharkhand', label: '20 - Jharkhand' },
  { code: '21', name: 'Odisha', label: '21 - Odisha' },
  { code: '22', name: 'Chhattisgarh', label: '22 - Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh', label: '23 - Madhya Pradesh' },
  { code: '24', name: 'Gujarat', label: '24 - Gujarat' },
  { code: '25', name: 'Daman and Diu', label: '25 - Daman and Diu' },
  { code: '26', name: 'Dadra and Nagar Haveli', label: '26 - Dadra and Nagar Haveli' },
  { code: '27', name: 'Maharashtra', label: '27 - Maharashtra' },
  { code: '28', name: 'Andhra Pradesh', label: '28 - Andhra Pradesh' },
  { code: '29', name: 'Karnataka', label: '29 - Karnataka' },
  { code: '30', name: 'Goa', label: '30 - Goa' },
  { code: '31', name: 'Lakshadweep', label: '31 - Lakshadweep' },
  { code: '32', name: 'Kerala', label: '32 - Kerala' },
  { code: '33', name: 'Tamil Nadu', label: '33 - Tamil Nadu' },
  { code: '34', name: 'Puducherry', label: '34 - Puducherry' },
  { code: '35', name: 'Andaman and Nicobar Islands', label: '35 - Andaman and Nicobar Islands' },
  { code: '36', name: 'Telangana', label: '36 - Telangana' },
  { code: '37', name: 'Andhra Pradesh (New)', label: '37 - Andhra Pradesh (New)' },
  { code: '38', name: 'Ladakh', label: '38 - Ladakh' },
  { code: '97', name: 'Other Territory', label: '97 - Other Territory' },
];

export const STATE_CODE_TO_NAME: Record<string, string> = INDIAN_STATES.reduce(
  (acc, curr) => {
    acc[curr.code] = curr.name;
    return acc;
  },
  {} as Record<string, string>
);

export function getStateName(code: string | null | undefined): string {
  if (!code) return '';
  const padded = code.trim().padStart(2, '0');
  return STATE_CODE_TO_NAME[padded] || '';
}

export function formatStateWithCode(code: string | null | undefined): string {
  if (!code) return '';
  const name = getStateName(code);
  const padded = code.trim().padStart(2, '0');
  return name ? `${padded} - ${name}` : padded;
}
