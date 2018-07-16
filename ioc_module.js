'use strict';

const FlowNodeInstanceRepository = require('./dist/commonjs/index').FlowNodeInstanceRepository;

function registerInContainer(container) {

  container.register('FlowNodeInstanceRepository', FlowNodeInstanceRepository)
    .configure('process_engine:flow_node_instance_repository')
    .singleton();
}

module.exports.registerInContainer = registerInContainer;
