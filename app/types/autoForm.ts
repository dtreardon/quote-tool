import type { QuoteData } from './form'

export type { QuoteData }

export interface VehicleData {
  uid: number
  type: string
  commercial_use: boolean
  vin: string
  year: string
  make: string
  model: string
  color: string
  annual_mileage: string
  comp: string
  collision: string
  comp_ded: string
  collision_ded: string
  lienholder_name: string
  lienholder_street: string
  lienholder_city: string
  lienholder_state: string
  lienholder_zip: string
  loan_number: string
  notes: string
}

export interface DriverData {
  uid: number
  secondary_named_insured: boolean
  first: string
  middle: string
  last: string
  suffix: string
  dob: string
  ssn: string
  marital: string
  occupation: string
  phone: string
  email: string
  license_number: string
  license_state: string
  sr22: string
}

export interface AutoFormState {
  // Notes
  notes: string

  // Section 1 - File & Referral
  agent: string
  referred_by_name: string
  referred_by_company: string
  new_purchase: string
  closing_date: string
  sales_price: string
  current_carrier: string
  premium: string

  // Section 2 - Drivers
  drivers: DriverData[]

  // Section 3 - Addresses
  garaging_street: string
  garaging_city: string
  garaging_state: string
  garaging_zip: string
  mail_same_as_garaging: boolean
  mail_street: string
  mail_city: string
  mail_state: string
  mail_zip: string

  // Section 4 - Vehicles
  vehicles: VehicleData[]

  // Section 5 - Coverage
  cov_bi: string
  cov_pd: string
  cov_um: string
  cov_uim: string
  pip_med_pay: string
  rental_reimbursement: string
  roadside: string

  // Section 6 - Underwriting
  has_dui: string
  has_violations: string
  num_violations: string
  has_accidents: string
  num_accidents: string
  bankruptcy: string

  // Section 7 - Quotes
  quotes: QuoteData[]
}

export const INITIAL_VEHICLE: VehicleData = {
  uid: 1,
  type: '',
  commercial_use: false,
  vin: '',
  year: '',
  make: '',
  model: '',
  color: '',
  annual_mileage: '',
  comp: '',
  collision: '',
  comp_ded: '',
  collision_ded: '',
  lienholder_name: '',
  lienholder_street: '',
  lienholder_city: '',
  lienholder_state: '',
  lienholder_zip: '',
  loan_number: '',
  notes: '',
}

export const INITIAL_DRIVER: DriverData = {
  uid: 1,
  secondary_named_insured: false,
  first: '',
  middle: '',
  last: '',
  suffix: '',
  dob: '',
  ssn: '',
  marital: '',
  occupation: '',
  phone: '',
  email: '',
  license_number: '',
  license_state: '',
  sr22: '',
}

export const INITIAL_AUTO_FORM: AutoFormState = {
  notes: '',
  agent: '',
  referred_by_name: '',
  referred_by_company: '',
  new_purchase: '',
  closing_date: '',
  sales_price: '',
  current_carrier: '',
  premium: '',
  drivers: [{ ...INITIAL_DRIVER }],
  garaging_street: '',
  garaging_city: '',
  garaging_state: '',
  garaging_zip: '',
  mail_same_as_garaging: false,
  mail_street: '',
  mail_city: '',
  mail_state: '',
  mail_zip: '',
  vehicles: [{ ...INITIAL_VEHICLE }],
  cov_bi: '',
  cov_pd: '',
  cov_um: '',
  cov_uim: '',
  pip_med_pay: '',
  rental_reimbursement: '',
  roadside: '',
  has_dui: '',
  has_violations: '',
  num_violations: '0',
  has_accidents: '',
  num_accidents: '0',
  bankruptcy: '',
  quotes: [{ uid: 1, carrier: '', premium: '' }],
}
