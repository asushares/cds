// Author: Preston Lee
const request = require('supertest');
// const assert = require('assert');
// import request from 'supertest';
// import assert from 'assert';
// import supertest from "@types/supertest";

import app from '../src/api';


describe('GET /', () => {

    test('it should return a valid JSON document', done => {
        expect(42).toBe(42);
        request(app)
            .get('/')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect((res: any) => {
                if (!res.body.message) {
                    throw new Error("Document didn't include expected properties");
                }
            })
            .expect(200, done);
    });




});

describe('GET /cds-services', () => {

    test('it should not choke or query parameters', done => {
        request(app)
            .get('/cds-services?foo=bar&type=valid&crap=null&junk=nil&bad=undefined')
            .expect(200, done);
    });

    test('it should contain at least one service declaration', done => {
        request(app)
            .get('/cds-services')
            .expect((res: any) => {
                console.log(res.body);
                if (res.body.services.length == 0) {
                    throw new Error("No services provided!");
                } else {
                    for (let n = 0; n < res.body.services.length; n++) {
                        let r = res.body.services[n];
                        if (!r.hook || !r.description || !r.id || !r.title) {
                            throw new Error("Missing FHIR resource property!");
                        }
                    }
                }
            })
            .expect(200, done);
    });

});