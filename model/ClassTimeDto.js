import {BaseDto} from "./BaseDto.js";

export class ClassTimeDto extends BaseDto {
    constructor(props) {
        super(props.id);
        this.day = props.day;
        this.class_time = props.class_time;
    }

}