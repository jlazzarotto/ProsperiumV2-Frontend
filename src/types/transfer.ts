export interface Transfer {
  id?: string;
  code: string;
  date: Date;
  value: number;
  originId: string;
  destinationId: string;
  description?: string;
  businessUnitId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransferFormData {
  id?: string;
  code: string;
  date: Date;
  value: string;
  originId: string;
  destinationId: string;
  description?: string;
}
