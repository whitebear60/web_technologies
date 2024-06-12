import {BaseDto} from "./BaseDto.js";

export class ScheduleDto extends BaseDto {
    constructor(props) {
        super(props.id);
        this.time = props.time;
        this.subject = props.subject;
        this.group = props.group;
    }

}