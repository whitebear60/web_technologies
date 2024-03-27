import {BaseDto} from "./BaseDto.js";

export class ClientDto extends BaseDto{
    constructor(data) {
        super(data.client_id);
        this.company = data.company;
        this.address = data.address;
        this.phone = data.phone;
    }
}