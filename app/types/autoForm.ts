import type { InsuredData, QuoteData } from './form'

export type { InsuredData, QuoteData }

export interface VehicleData {
  uid: number
  type: string
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
  notes: string
}

export interface DriverData {
  uid: number
  first: string
  last: string
  dob: string
  license_number: string
  license_state: string
  relationship: string
  good_student: string
  sr22: string
}

export interface AutoFormState {
  // Banner
  policy_type: string
  sr22_required: string

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
  mortgagee_open: boolean
  mortgagee_name: string
  mortgagee_street: string
  mortgagee_city: string
  mortgagee_state: string
  mortgagee_zip: string
  loan_number: string

  // Section 2 - Insured
  insureds: InsuredData[]

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

  // Section 5 - Drivers
  drivers: DriverData[]

  // Section 6 - Coverage
  cov_bi: string
  cov_pd: string
  cov_um: string
  cov_uim: string
  cov_med: string
  cov_pip: string
  rental_reimbursement: string
  roadside: string

  // Section 7 - Underwriting
  has_dui: string
  has_violations: string
  num_violations: string
  has_accidents: string
  num_accidents: string
  bankruptcy: string

  // Section 8 - Quotes
  quotes: QuoteData[]
}

export const INITIAL_VEHICLE: VehicleData = {
  uid: 1,
  type: '',
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
  notes: '',
}

export const INITIAL_DRIVER: DriverData = {
  uid: 1,
  first: '',
  last: '',
  dob: '',
  license_number: '',
  license_state: '',
  relationship: '',
  good_student: '',
  sr22: '',
}

export const INITIAL_AUTO_FORM: AutoFormState = {
  policy_type: 'Personal Auto',
  sr22_required: '',
  notes: '',
  agent: '',
  referred_by_name: '',
  referred_by_company: '',
  new_purchase: '',
  closing_date: '',
  sales_price: '',
  current_carrier: '',
  premium: '',
  mortgagee_open: false,
  mortgagee_name: '',
  mortgagee_street: '',
  mortgagee_city: '',
  mortgagee_state: '',
  mortgagee_zip: '',
  loan_number: '',
  insureds: [
    {
      uid: 1,
      first: '', middle: '', last: '', suffix: '',
      dob: '', ssn: '', marital: '', occupation: '',
      relationship: '', phone: '', email: '',
      showContact: false,
    }
  ],
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
  drivers: [{ ...INITIAL_DRIVER }],
  cov_bi: '',
  cov_pd: '',
  cov_um: '',
  cov_uim: '',
  cov_med: '',
  cov_pip: '',
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
