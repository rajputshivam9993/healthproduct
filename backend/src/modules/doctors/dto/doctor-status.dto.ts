import { IsEnum } from 'class-validator';

/** Admin action on a doctor account (Req 17.7). */
export enum DoctorAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  ACTIVATE = 'ACTIVATE',
  DEACTIVATE = 'DEACTIVATE',
}

export class DoctorStatusDto {
  @IsEnum(DoctorAction)
  action!: DoctorAction;
}
