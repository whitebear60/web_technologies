import {BaseDto} from "./BaseDto.js";

export class SortDto extends BaseDto{
    constructor(data) {
        super(data.sort_id);
        this.name = data.name;
        this.year = data.year;
        this.adaptation = data.adaptation;
        this.frost = data.frost;
        this.description = data.description;
        this.technology = data.technology;
        this.picture = data.picture;
        this.approved = data.approved;
        this.period = data.period;
    }
}