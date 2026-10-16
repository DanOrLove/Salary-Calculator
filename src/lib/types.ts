export type ScheduleType = "2/2" | "3/3";

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  full_name_key: string;
  sales_percent: number;
  base_payout: number;
  schedule_type: ScheduleType | null;
  schedule_anchor: string | null;
  schedule_pattern: string | null;
  /** Дни месяца, когда приходит зарплата: "5,20" */
  salary_days: string;
  /** SHA-256 от соли и 4-значного кода */
  pin_hash: string;
  pin_salt: string;
  onboarded: boolean;
  created_at: string;
}

export interface Sale {
  id: string;
  employee_id: string;
  sale_date: string;
  total_amount: number;
  payout: number;
  created_at: string;
}

export interface DayOverride {
  employee_id: string;
  work_date: string;
  is_work: boolean;
}

export interface Session {
  employeeId: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  /** Время последней активности — от него считается 5-часовой простой */
  lastActivityAt: string;
}
