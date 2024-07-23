import keys from "./api/keys";

class Status {
    public end() {}
}

class Response {
    public setHeader(){};
    public status(){return new Status()};
    public json(){};
}

keys({
    "body": "aa",
    "method": "POST"
}, new Response());