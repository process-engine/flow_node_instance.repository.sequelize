import {NotFoundError} from '@essential-projects/errors_ts';
import {SequelizeConnectionManager} from '@essential-projects/sequelize_connection_manager';
import {BpmnType, EventType, IFlowNodeInstanceRepository, Model, Runtime} from '@process-engine/process_engine_contracts';

import * as clone from 'clone';
import * as Sequelize from 'sequelize';

import {loadModels} from './model_loader';
import {
  FlowNodeInstance as FlowNodeInstanceModel,
  IFlowNodeInstanceAttributes,
  IProcessTokenAttributes,
  ProcessToken,
} from './schemas';

export class FlowNodeInstanceRepository implements IFlowNodeInstanceRepository {

  public config: Sequelize.Options;

  private _flowNodeInstanceModel: Sequelize.Model<FlowNodeInstanceModel, IFlowNodeInstanceAttributes>;
  private _processTokenModel: Sequelize.Model<ProcessToken, IProcessTokenAttributes>;

  private _sequelize: Sequelize.Sequelize;
  private _connectionManager: SequelizeConnectionManager;

  constructor(connectionManager: SequelizeConnectionManager) {
    this._connectionManager = connectionManager;
  }

  private get flowNodeInstanceModel(): Sequelize.Model<FlowNodeInstanceModel, IFlowNodeInstanceAttributes> {
    return this._flowNodeInstanceModel;
  }

  private get processTokenModel(): Sequelize.Model<ProcessToken, IProcessTokenAttributes> {
    return this._processTokenModel;
  }

  public async initialize(): Promise<void> {
    this._sequelize = await this._connectionManager.getConnection(this.config);
    await loadModels(this._sequelize);

    this._flowNodeInstanceModel = this._sequelize.models.FlowNodeInstance;
    this._processTokenModel = this._sequelize.models.ProcessToken;
  }

  public async querySpecificFlowNode(correlationId: string, processModelId: string, flowNodeId: string): Promise<Runtime.Types.FlowNodeInstance> {

    const result: FlowNodeInstanceModel = await this.flowNodeInstanceModel.findOne({
      where: {
        flowNodeId: flowNodeId,
      },
      include: [{
        model: this.processTokenModel,
        as: 'processTokens',
        required: true,
        where: {
          correlationId: correlationId,
          processModelId: processModelId,
        },
      }],
    });

    const flowNodeInstanceNotFound: boolean = result === null || result === undefined;
    if (flowNodeInstanceNotFound) {
      throw new NotFoundError(`FlowNodeInstance with flowNodeId "${flowNodeId}" does not exist.`);
    }

    const flowNodeInstance: Runtime.Types.FlowNodeInstance = this._convertFlowNodeInstanceToRuntimeObject(result);

    return flowNodeInstance;
  }

  public async queryByFlowNodeId(flowNodeId: string): Promise<Array<Runtime.Types.FlowNodeInstance>> {

    const results: Array<FlowNodeInstanceModel> = await this.flowNodeInstanceModel.findAll({
      where: {
        flowNodeId: flowNodeId,
      },
      include: [{
        model: this.processTokenModel,
        as: 'processTokens',
      }],
      order: [
        [ 'createdAt', 'DESC' ],
      ],
    });

    const flowNodeInstances: Array<Runtime.Types.FlowNodeInstance> = results.map(this._convertFlowNodeInstanceToRuntimeObject.bind(this));

    return flowNodeInstances;
  }

  public async queryByInstanceId(flowNodeInstanceId: string): Promise<Runtime.Types.FlowNodeInstance> {

    const matchingFlowNodeInstance: FlowNodeInstanceModel = await this.flowNodeInstanceModel.findOne({
      where: {
        flowNodeInstanceId: flowNodeInstanceId,
      },
      include: [{
        model: this.processTokenModel,
        as: 'processTokens',
      }],
    });

    if (!matchingFlowNodeInstance) {
      throw new NotFoundError(`FlowNodeInstance with flowNodeInstanceId "${flowNodeInstanceId}" does not exist.`);
    }

    const runtimeFlowNodeInstance: Runtime.Types.FlowNodeInstance = this._convertFlowNodeInstanceToRuntimeObject(matchingFlowNodeInstance);

    return runtimeFlowNodeInstance;
  }

  public async queryActive(): Promise<Array<Runtime.Types.FlowNodeInstance>> {

    const results: Array<FlowNodeInstanceModel> = await this.flowNodeInstanceModel.findAll({
      where: {
        state: {
          $in: [Runtime.Types.FlowNodeInstanceState.suspended, Runtime.Types.FlowNodeInstanceState.running],
        },
      },
      include: [{
        model: this.processTokenModel,
        as: 'processTokens',
      }],
    });

    const runtimeFlowNodeInstances: Array<Runtime.Types.FlowNodeInstance> = results.map(this._convertFlowNodeInstanceToRuntimeObject.bind(this));

    return runtimeFlowNodeInstances;
  }

  public async queryActiveByProcessInstance(processInstanceId: string): Promise<Array<Runtime.Types.FlowNodeInstance>> {

    const results: Array<FlowNodeInstanceModel> = await this.flowNodeInstanceModel.findAll({
      where: {
        state: {
          $in: [Runtime.Types.FlowNodeInstanceState.suspended, Runtime.Types.FlowNodeInstanceState.running],
        },
      },
      include: [{
        model: this.processTokenModel,
        as: 'processTokens',
        where: {
          processInstanceId: processInstanceId,
        },
        required: true,
      }],
    });

    const runtimeFlowNodeInstances: Array<Runtime.Types.FlowNodeInstance> = results.map(this._convertFlowNodeInstanceToRuntimeObject.bind(this));

    return runtimeFlowNodeInstances;
  }

  public async queryActiveByCorrelationAndProcessModel(correlationId: string,
                                                       processModelId: string): Promise<Array<Runtime.Types.FlowNodeInstance>> {

    const results: Array<FlowNodeInstanceModel> = await this.flowNodeInstanceModel.findAll({
      where: {
        state: {
          $in: [Runtime.Types.FlowNodeInstanceState.suspended, Runtime.Types.FlowNodeInstanceState.running],
        },
      },
      include: [{
        model: this.processTokenModel,
        as: 'processTokens',
        where: {
          correlationId: correlationId,
          processModelId: processModelId,
        },
        required: true,
      }],
    });

    // TODO - BUG: For some reason the "this" context gets lost here, unless a bind is made.
    const flowNodeInstances: Array<Runtime.Types.FlowNodeInstance> = results.map(this._convertFlowNodeInstanceToRuntimeObject.bind(this));

    return flowNodeInstances;
  }

  public async queryByState(state: Runtime.Types.FlowNodeInstanceState): Promise<Array<Runtime.Types.FlowNodeInstance>> {

    const results: Array<FlowNodeInstanceModel> = await this.flowNodeInstanceModel.findAll({
      where: {
        state: state,
      },
      include: [{
        model: this.processTokenModel,
        as: 'processTokens',
        required: true,
      }],
      order: [
        [ 'createdAt', 'DESC' ],
      ],
    });

    const flowNodeInstances: Array<Runtime.Types.FlowNodeInstance> = results.map(this._convertFlowNodeInstanceToRuntimeObject.bind(this));

    return flowNodeInstances;
  }

  public async queryByCorrelation(correlationId: string): Promise<Array<Runtime.Types.FlowNodeInstance>> {

    const results: Array<FlowNodeInstanceModel> = await this.flowNodeInstanceModel.findAll({
      include: [{
        model: this.processTokenModel,
        as: 'processTokens',
        where: {
          correlationId: correlationId,
        },
        required: true,
      }],
      order: [
        [ 'createdAt', 'DESC' ],
      ],
    });

    const flowNodeInstances: Array<Runtime.Types.FlowNodeInstance> = results.map(this._convertFlowNodeInstanceToRuntimeObject.bind(this));

    return flowNodeInstances;
  }

  public async queryByProcessModel(processModelId: string): Promise<Array<Runtime.Types.FlowNodeInstance>> {

    const results: Array<FlowNodeInstanceModel> = await this.flowNodeInstanceModel.findAll({
      include: [{
        model: this.processTokenModel,
        as: 'processTokens',
        where: {
          processModelId: processModelId,
        },
        required: true,
      }],
      order: [
        [ 'createdAt', 'DESC' ],
      ],
    });

    const flowNodeInstances: Array<Runtime.Types.FlowNodeInstance> = results.map(this._convertFlowNodeInstanceToRuntimeObject.bind(this));

    return flowNodeInstances;
  }

  public async queryByCorrelationAndProcessModel(correlationId: string, processModelId: string): Promise<Array<Runtime.Types.FlowNodeInstance>> {

    const results: Array<FlowNodeInstanceModel> = await this.flowNodeInstanceModel.findAll({
      include: [{
        model: this.processTokenModel,
        as: 'processTokens',
        where: {
          correlationId: correlationId,
          processModelId: processModelId,
        },
        required: true,
      }],
    });

    // TODO - BUG: For some reason the "this" context gets lost here, unless a bind is made.
    const flowNodeInstances: Array<Runtime.Types.FlowNodeInstance> = results.map(this._convertFlowNodeInstanceToRuntimeObject.bind(this));

    return flowNodeInstances;
  }

  public async querySuspendedByCorrelation(correlationId: string): Promise<Array<Runtime.Types.FlowNodeInstance>> {

    const results: Array<FlowNodeInstanceModel> = await this.flowNodeInstanceModel.findAll({
      where: {
        state: Runtime.Types.FlowNodeInstanceState.suspended,
      },
      include: [{
        model: this.processTokenModel,
        as: 'processTokens',
        where: {
          correlationId: correlationId,
        },
        required: true,
      }],
      order: [
        [ 'createdAt', 'DESC' ],
      ],
    });

    const flowNodeInstances: Array<Runtime.Types.FlowNodeInstance> = results.map(this._convertFlowNodeInstanceToRuntimeObject.bind(this));

    return flowNodeInstances;
  }

  public async querySuspendedByProcessModel(processModelId: string): Promise<Array<Runtime.Types.FlowNodeInstance>> {

    const results: Array<FlowNodeInstanceModel> = await this.flowNodeInstanceModel.findAll({
      where: {
        state: Runtime.Types.FlowNodeInstanceState.suspended,
      },
      include: [{
        model: this.processTokenModel,
        as: 'processTokens',
        where: {
          processModelId: processModelId,
        },
        required: true,
      }],
      order: [
        [ 'createdAt', 'DESC' ],
      ],
    });

    const flowNodeInstances: Array<Runtime.Types.FlowNodeInstance> = results.map(this._convertFlowNodeInstanceToRuntimeObject.bind(this));

    return flowNodeInstances;
  }

  public async queryProcessTokensByProcessInstanceId(processInstanceId: string): Promise<Array<Runtime.Types.ProcessToken>> {

    const processInstanceTokens: Array<ProcessToken> = await this.processTokenModel.findAll({
      where: {
        processInstanceId: processInstanceId,
      },
      order: [
        [ 'createdAt', 'DESC' ],
      ],
    });

    const flowNodeInstances: Array<Runtime.Types.ProcessToken> = processInstanceTokens.map(this._convertProcessTokenToRuntimeObject.bind(this));

    return flowNodeInstances;
  }

  public async deleteByProcessModelId(processModelId: string): Promise<void> {
    const flowNodeInstancesToRemove: Array<Runtime.Types.FlowNodeInstance> = await this.queryByProcessModel(processModelId);
    const flowNodeInstanceIdsToRemove: Array<string> = flowNodeInstancesToRemove.map(((flowNodeInstance: Runtime.Types.FlowNodeInstance): string => {
      return flowNodeInstance.id;
    }));

    const flowNodeQueryParams: Sequelize.DestroyOptions = {
      where: {
        flowNodeInstanceId: flowNodeInstanceIdsToRemove,
      },
    };

    const processTokenQueryParams: Sequelize.DestroyOptions = {
      where: {
        processModelId: processModelId,
      },
    };

    await this.processTokenModel.destroy(processTokenQueryParams);
    await this.flowNodeInstanceModel.destroy(flowNodeQueryParams);
  }

  public async persistOnEnter(flowNode: Model.Base.FlowNode,
                              flowNodeInstanceId: string,
                              processToken: Runtime.Types.ProcessToken,
                              previousFlowNodeInstanceId: string): Promise<Runtime.Types.FlowNodeInstance> {

    const createParams: any = {
      flowNodeId: flowNode.id,
      flowNodeType: flowNode.bpmnType,
      eventType: (flowNode as any).eventType,
      flowNodeInstanceId: flowNodeInstanceId,
      state: Runtime.Types.FlowNodeInstanceState.running,
      previousFlowNodeInstanceId: previousFlowNodeInstanceId,
    };

    await this.flowNodeInstanceModel.create(createParams);
    await this._createProcessTokenForFlowNodeInstance(flowNodeInstanceId, processToken, Runtime.Types.ProcessTokenType.onEnter);

    return this.queryByInstanceId(flowNodeInstanceId);
  }

  public async persistOnExit(flowNode: Model.Base.FlowNode,
                             flowNodeInstanceId: string,
                             processToken: Runtime.Types.ProcessToken): Promise<Runtime.Types.FlowNodeInstance> {

    const flowNodeInstanceState: Runtime.Types.FlowNodeInstanceState = Runtime.Types.FlowNodeInstanceState.finished;
    const processTokenType: Runtime.Types.ProcessTokenType = Runtime.Types.ProcessTokenType.onExit;

    return this._persistOnStateChange(flowNode.id, flowNodeInstanceId, processToken, flowNodeInstanceState, processTokenType);
  }

  public async persistOnError(flowNode: Model.Base.FlowNode,
                              flowNodeInstanceId: string,
                              processToken: Runtime.Types.ProcessToken,
                              error: Error): Promise<Runtime.Types.FlowNodeInstance> {

    const flowNodeInstanceState: Runtime.Types.FlowNodeInstanceState = Runtime.Types.FlowNodeInstanceState.error;
    const processTokenType: Runtime.Types.ProcessTokenType = Runtime.Types.ProcessTokenType.onExit;

    return this._persistOnStateChange(flowNode.id, flowNodeInstanceId, processToken, flowNodeInstanceState, processTokenType, error);
  }

  public async persistOnTerminate(flowNode: Model.Base.FlowNode,
                                  flowNodeInstanceId: string,
                                  processToken: Runtime.Types.ProcessToken): Promise<Runtime.Types.FlowNodeInstance> {

    const flowNodeInstanceState: Runtime.Types.FlowNodeInstanceState = Runtime.Types.FlowNodeInstanceState.terminated;
    const processTokenType: Runtime.Types.ProcessTokenType = Runtime.Types.ProcessTokenType.onExit;

    return this._persistOnStateChange(flowNode.id, flowNodeInstanceId, processToken, flowNodeInstanceState, processTokenType);
  }

  public async suspend(flowNodeId: string,
                       flowNodeInstanceId: string,
                       processToken: Runtime.Types.ProcessToken): Promise<Runtime.Types.FlowNodeInstance> {

    const flowNodeInstanceState: Runtime.Types.FlowNodeInstanceState = Runtime.Types.FlowNodeInstanceState.suspended;
    const processTokenType: Runtime.Types.ProcessTokenType = Runtime.Types.ProcessTokenType.onSuspend;

    return this._persistOnStateChange(flowNodeId, flowNodeInstanceId, processToken, flowNodeInstanceState, processTokenType);
  }

  public async resume(flowNodeId: string,
                      flowNodeInstanceId: string,
                      processToken: Runtime.Types.ProcessToken): Promise<Runtime.Types.FlowNodeInstance> {

    const flowNodeInstanceState: Runtime.Types.FlowNodeInstanceState = Runtime.Types.FlowNodeInstanceState.running;
    const processTokenType: Runtime.Types.ProcessTokenType = Runtime.Types.ProcessTokenType.onResume;

    return this._persistOnStateChange(flowNodeId, flowNodeInstanceId, processToken, flowNodeInstanceState, processTokenType);
  }

  private async _persistOnStateChange(flowNodeId: string,
                                      flowNodeInstanceId: string,
                                      token: Runtime.Types.ProcessToken,
                                      newState: Runtime.Types.FlowNodeInstanceState,
                                      processTokenType: Runtime.Types.ProcessTokenType,
                                      error?: Error): Promise<Runtime.Types.FlowNodeInstance> {

    const matchingFlowNodeInstance: FlowNodeInstanceModel = await this.flowNodeInstanceModel.findOne({
      where: {
        flowNodeId: flowNodeId,
        flowNodeInstanceId: flowNodeInstanceId,
      },
    });

    if (!matchingFlowNodeInstance) {
      throw new Error(`flow node with instance id '${flowNodeInstanceId}' not found!`);
    }

    matchingFlowNodeInstance.state = newState;

    if (error) {
      matchingFlowNodeInstance.error = error.toString();
    }

    await matchingFlowNodeInstance.save();

    await this._createProcessTokenForFlowNodeInstance(flowNodeInstanceId, token, processTokenType);

    const updatedFlowNodeInstance: Runtime.Types.FlowNodeInstance = await this.queryByInstanceId(flowNodeInstanceId);

    return updatedFlowNodeInstance;
  }

  private async _createProcessTokenForFlowNodeInstance(flowNodeInstanceId: string,
                                                       token: Runtime.Types.ProcessToken,
                                                       type: Runtime.Types.ProcessTokenType): Promise<void> {

    const createParams: any = clone(token);
    createParams.identity = JSON.stringify(createParams.identity);
    createParams.payload = JSON.stringify(createParams.payload);
    createParams.type = type;
    createParams.flowNodeInstanceId = flowNodeInstanceId;

    await this.processTokenModel.create(createParams);
  }

  private _convertFlowNodeInstanceToRuntimeObject(dataModel: FlowNodeInstanceModel): Runtime.Types.FlowNodeInstance {

    const runtimeFlowNodeInstance: Runtime.Types.FlowNodeInstance = new Runtime.Types.FlowNodeInstance();
    runtimeFlowNodeInstance.id = dataModel.flowNodeInstanceId;
    runtimeFlowNodeInstance.flowNodeType = <BpmnType> dataModel.flowNodeType;
    runtimeFlowNodeInstance.eventType = <EventType> dataModel.eventType;
    runtimeFlowNodeInstance.flowNodeId = dataModel.flowNodeId;
    runtimeFlowNodeInstance.processInstanceId = dataModel.processTokens[0].processInstanceId;
    runtimeFlowNodeInstance.processModelId = dataModel.processTokens[0].processModelId;
    runtimeFlowNodeInstance.correlationId = dataModel.processTokens[0].correlationId;
    runtimeFlowNodeInstance.state = dataModel.state;
    runtimeFlowNodeInstance.error = dataModel.error;
    runtimeFlowNodeInstance.previousFlowNodeInstanceId = dataModel.previousFlowNodeInstanceId;

    const processTokens: Array<Runtime.Types.ProcessToken> = dataModel.processTokens.map(this._convertProcessTokenToRuntimeObject);

    runtimeFlowNodeInstance.tokens = processTokens;

    return runtimeFlowNodeInstance;
  }

  private _convertProcessTokenToRuntimeObject(dataModel: ProcessToken): Runtime.Types.ProcessToken {

    const processToken: Runtime.Types.ProcessToken = new Runtime.Types.ProcessToken();
    processToken.processInstanceId = dataModel.processInstanceId;
    processToken.processModelId = dataModel.processModelId;
    processToken.correlationId = dataModel.correlationId;
    processToken.flowNodeInstanceId = dataModel.flowNodeInstanceId;
    processToken.identity = dataModel.identity ? JSON.parse(dataModel.identity) : undefined;
    processToken.createdAt = dataModel.createdAt;
    processToken.caller = dataModel.caller;
    processToken.type = Runtime.Types.ProcessTokenType[dataModel.type];
    processToken.payload = dataModel.payload ? JSON.parse(dataModel.payload) : {};

    return processToken;
  }
}
