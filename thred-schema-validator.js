
module.exports = function(RED) {
    "use strict";

    function ThredSchemaValidator(config) {
        RED.nodes.createNode(this,config);

        let node = this;
        let err;

        const axios = require('axios').default;
        const Ajv2020 = require("ajv/dist/2020");
        const ajv = new Ajv2020({loadSchema: loadSchema});


        async function loadSchema(url) {
            try {
              const response = await axios.get(url);
              return response.data
            } catch (error) {
                err = error;
                if (done) {
                  // Node-RED 1.0 compatible
                    done(err);
                } else {
                    // Node-RED 0.x compatible
                    node.error(err, msg);
                }
            }

          }
        

        this.on('input', function(msg, send, done) {

            async function validate(schema_id, payload) {
              let validate_obj;
              let valid;
              let errors;
              // check if valid
              let is_valid = ajv.getSchema(msg.schema_id);
              // if valid, validate
              if (is_valid) {
                validate_obj = is_valid;
              } else {
                // fetch schema
                let schema = await loadSchema(schema_id);
                // validate
                validate_obj = await ajv.compileAsync(schema);
              }
              valid = validate_obj(payload);
              errors = validate_obj.errors;
              return [valid, errors]
            }

            let validation = validate(msg.schema_id, msg.payload)
              .then(function (r) {
                // console.log(r);
                msg.validation = {
                  "valid": r[0],
                  "errors": r[1]
                };
                send(msg);
              })
              .catch(function (error) {
                err = error;
                if (done) {
                    // Node-RED 1.0 compatible
                    done(err);
                } else {
                    // Node-RED 0.x compatible
                    node.error(err, msg);
                }
              });

          });
    }

    RED.nodes.registerType("thred-validator",ThredSchemaValidator);
}
