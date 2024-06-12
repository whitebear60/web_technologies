import {BaseDto} from "./BaseDto.js";

export class TeacherDto extends BaseDto {
    constructor(props) {
        super(props.id);
        this.last_name = props.last_name;
        this.first_name = props.first_name;
        this.middle_name = props.middle_name;
    }

}