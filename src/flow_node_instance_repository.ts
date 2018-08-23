import {getConnection} from '@essential-projects/sequelize_connection_manager';
import {IFlowNodeInstanceRepository, Runtime} from '@process-engine/process_engine_contracts';

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

  private sequelize: Sequelize.Sequelize;

  private get flowNodeInstanceModel(): Sequelize.Model<FlowNodeInstanceModel, IFlowNodeInstanceAttributes> {
    return this._flowNodeInstanceModel;
  }

  private get processTokenModel(): Sequelize.Model<ProcessToken, IProcessTokenAttributes> {
    return this._processTokenModel;
  }

  public async initialize(): Promise<void> {
    this.sequelize = await getConnection(this.config);
    await loadModels(this.sequelize);

    this._flowNodeInstanceModel = this.sequelize.models.FlowNodeInstance;
    this._processTokenModel = this.sequelize.models.ProcessToken;
  }

  public async getFlowNodeInstanceById(flowNodeInstanceId: string): Promise<Runtime.Types.FlowNodeInstance> {

    const matchingFlowNodeInstance: FlowNodeInstanceModel = await this.flowNodeInstanceModel.findOne({
      where: {
        flowNodeInstanceId: flowNodeInstanceId,
      },
      include: [{
        model: this.processTokenModel,
        as: 'processToken',
        required: true,
      }],
    });

    if (matchingFlowNodeInstance === null) {
      return null;
    }

    const flowNodeInstance: Runtime.Types.FlowNodeInstance = this._convertFlowNodeInstanceToRuntimeObject(matchingFlowNodeInstance);

    return flowNodeInstance;
  }

  public async persistOnEnter(processToken: Runtime.Types.ProcessToken,
                              flowNodeId: string,
                              flowNodeInstanceId: string): Promise<Runtime.Types.FlowNodeInstance> {

    const persistableProcessToken: any = clone(processToken);
    persistableProcessToken.identity = JSON.stringify(persistableProcessToken.identity);
    persistableProcessToken.payload = JSON.stringify(persistableProcessToken.payload);
    persistableProcessToken.flowNodeInstanceId = flowNodeInstanceId;

    const createParams: any = {
      flowNodeId: flowNodeId,
      flowNodeInstanceId: flowNodeInstanceId,
      state: Runtime.Types.FlowNodeInstanceState.running,
      isSuspended: false,
      processToken: persistableProcessToken,
    };

    const result: FlowNodeInstanceModel = await this.flowNodeInstanceModel.create(
      createParams, {
      include: [{
        model: this.processTokenModel,
        as: 'processToken',
      }],
    });

    const flowNodeInstance: Runtime.Types.FlowNodeInstance = this._convertFlowNodeInstanceToRuntimeObject(result);

    return flowNodeInstance;
  }

  public async persistOnExit(newProcessToken: Runtime.Types.ProcessToken,
                             flowNodeId: string,
                             flowNodeInstanceId: string): Promise<Runtime.Types.FlowNodeInstance> {

    return this._persistOnStateChange(newProcessToken, flowNodeId, flowNodeInstanceId, Runtime.Types.FlowNodeInstanceState.finished);
  }

  public async persistOnError(newProcessToken: Runtime.Types.ProcessToken,
                              flowNodeId: string,
                              flowNodeInstanceId: string,
                              error: Error): Promise<Runtime.Types.FlowNodeInstance> {

    return this._persistOnStateChange(newProcessToken, flowNodeId, flowNodeInstanceId, Runtime.Types.FlowNodeInstanceState.error, error);
  }

  public async persistOnTerminate(token: Runtime.Types.ProcessToken,
                             flowNodeId: string,
                             flowNodeInstanceId: string): Promise<Runtime.Types.FlowNodeInstance> {

    return this._persistOnStateChange(token, flowNodeId, flowNodeInstanceId, Runtime.Types.FlowNodeInstanceState.terminated);
  }

  private async _persistOnStateChange(token: Runtime.Types.ProcessToken,
                                      flowNodeId: string,
                                      flowNodeInstanceId: string,
                                      newState: Runtime.Types.FlowNodeInstanceState,
                                      error?: Error): Promise<Runtime.Types.FlowNodeInstance> {

    const matchingFlowNodeInstance: FlowNodeInstanceModel = await this.flowNodeInstanceModel.findOne({
      where: {
        flowNodeId: flowNodeId,
        flowNodeInstanceId: flowNodeInstanceId,
      },
      include: [{
        model: this.processTokenModel,
        as: 'processToken',
        required: true,
      }],
    });

    if (!matchingFlowNodeInstance) {
      throw new Error(`flow node with instance id '${flowNodeInstanceId}' not found!`);
    }

    matchingFlowNodeInstance.state = newState;

    if (error) {
      matchingFlowNodeInstance.error = error.toString();
    }

    const currentToken: ProcessToken = matchingFlowNodeInstance.processToken;
    const updatedToken: ProcessToken = Object.assign(currentToken, token);
    updatedToken.identity = JSON.stringify(token.identity);
    updatedToken.payload = JSON.stringify(token.payload);

    matchingFlowNodeInstance.processToken = updatedToken;
    matchingFlowNodeInstance.save();
    const runtimeFlowNodeInstance: Runtime.Types.FlowNodeInstance = this._convertFlowNodeInstanceToRuntimeObject(matchingFlowNodeInstance);

    return runtimeFlowNodeInstance;
  }

  public async queryProcessTokensByProcessInstance(processInstanceId: string): Promise<Array<Runtime.Types.ProcessToken>> {

    const processInstanceTokens: Array<ProcessToken> = await this.processTokenModel.findAll({
      where: {
        processInstanceId: processInstanceId,
      },
    });

    const flowNodeInstances: Array<Runtime.Types.ProcessToken> = processInstanceTokens.map(this._convertProcessTokenToRuntimeObject.bind(this));

    return flowNodeInstances;
  }

  public async queryByState(state: Runtime.Types.FlowNodeInstanceState): Promise<Array<Runtime.Types.FlowNodeInstance>> {

    const results: Array<FlowNodeInstanceModel> = await this.flowNodeInstanceModel.findAll({
      where: {
        state: state,
      },
      include: [{
        model: this.processTokenModel,
        as: 'processToken',
        required: true,
      }],
    });

    // TODO - BUG: For some reason the "this" context gets lost here, unless a bind is made.
    // This effect has thus far been observed only in those operations that involve the consumer api.
    const flowNodeInstances: Array<Runtime.Types.FlowNodeInstance> = results.map(this._convertFlowNodeInstanceToRuntimeObject.bind(this));

    return flowNodeInstances;
  }

  public async queryByCorrelation(correlationId: string): Promise<Array<Runtime.Types.FlowNodeInstance>> {

    const results: Array<FlowNodeInstanceModel> = await this.flowNodeInstanceModel.findAll({
      include: [{
        model: this.processTokenModel,
        as: 'processToken',
        where: {
          correlationId: correlationId,
        },
        required: true,
      }],
    });

    // TODO - BUG: For some reason the "this" context gets lost here, unless a bind is made.
    // This effect has thus far been observed only in those operations that involve the consumer api.
    const flowNodeInstances: Array<Runtime.Types.FlowNodeInstance> = results.map(this._convertFlowNodeInstanceToRuntimeObject.bind(this));

    return flowNodeInstances;
  }

  public async queryByProcessModel(processModelId: string): Promise<Array<Runtime.Types.FlowNodeInstance>> {

    const results: Array<FlowNodeInstanceModel> = await this.flowNodeInstanceModel.findAll({
      include: [{
        model: this.processTokenModel,
        as: 'processToken',
        where: {
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
        isSuspended: true,
      },
      include: [{
        model: this.processTokenModel,
        as: 'processToken',
        where: {
          correlationId: correlationId,
        },
        required: true,
      }],
    });

    // TODO - BUG: For some reason the "this" context gets lost here, unless a bind is made.
    const flowNodeInstances: Array<Runtime.Types.FlowNodeInstance> = results.map(this._convertFlowNodeInstanceToRuntimeObject.bind(this));

    return flowNodeInstances;
  }

  public async querySuspendedByProcessModel(processModelId: string): Promise<Array<Runtime.Types.FlowNodeInstance>> {

    const results: Array<FlowNodeInstanceModel> = await this.flowNodeInstanceModel.findAll({
      where: {
        isSuspended: true,
      },
      include: [{
        model: this.processTokenModel,
        as: 'processToken',
        where: {
          processModelId: processModelId,
        },
        required: true,
      }],
    });

    // TODO - BUG: For some reason the "this" context gets lost here, unless a bind is made.
    const flowNodeInstances: Array<Runtime.Types.FlowNodeInstance> = results.map(this._convertFlowNodeInstanceToRuntimeObject.bind(this));

    return flowNodeInstances;
  }

  public async suspend(newProcessToken: Runtime.Types.ProcessToken,
                       flowNodeInstanceId: string): Promise<Runtime.Types.FlowNodeInstance> {

    const matchingFlowNodeInstance: FlowNodeInstanceModel = await this.flowNodeInstanceModel.findOne({
      where: {
        flowNodeInstanceId: flowNodeInstanceId,
      },
      include: [{
        model: this.processTokenModel,
        as: 'processToken',
        required: true,
      }],
    });

    if (!matchingFlowNodeInstance) {
      throw new Error(`flow node with instance id '${flowNodeInstanceId}' not found!`);
    }

    matchingFlowNodeInstance.isSuspended = true;

    const currentToken: ProcessToken = matchingFlowNodeInstance.processToken;
    const updatedToken: ProcessToken = Object.assign(currentToken, newProcessToken);
    updatedToken.identity = JSON.stringify(updatedToken.identity);
    updatedToken.payload = JSON.stringify(updatedToken.payload);

    matchingFlowNodeInstance.processToken = updatedToken;
    matchingFlowNodeInstance.save();
    const runtimeFlowNodeInstance: Runtime.Types.FlowNodeInstance = this._convertFlowNodeInstanceToRuntimeObject(matchingFlowNodeInstance);

    return runtimeFlowNodeInstance;
  }

  public async resume(flowNodeInstanceId: string): Promise<Runtime.Types.FlowNodeInstance> {

    const matchingFlowNodeInstance: FlowNodeInstanceModel = await this.flowNodeInstanceModel.findOne({
      where: {
        flowNodeInstanceId: flowNodeInstanceId,
      },
      include: [{
        model: this.processTokenModel,
        as: 'processToken',
        required: true,
      }],
    });

    if (!matchingFlowNodeInstance) {
      throw new Error(`flow node with instance id '${flowNodeInstanceId}' not found!`);
    }

    matchingFlowNodeInstance.isSuspended = false;
    matchingFlowNodeInstance.save();

    const runtimeFlowNodeInstance: Runtime.Types.FlowNodeInstance = this._convertFlowNodeInstanceToRuntimeObject(matchingFlowNodeInstance);

    return runtimeFlowNodeInstance;
  }

  private _convertFlowNodeInstanceToRuntimeObject(dataModel: FlowNodeInstanceModel): Runtime.Types.FlowNodeInstance {

    const runtimeFlowNodeInstance: Runtime.Types.FlowNodeInstance = new Runtime.Types.FlowNodeInstance();
    runtimeFlowNodeInstance.id = dataModel.flowNodeInstanceId;
    runtimeFlowNodeInstance.flowNodeId = dataModel.flowNodeId;
    runtimeFlowNodeInstance.state = dataModel.state;
    runtimeFlowNodeInstance.error = dataModel.error;
    runtimeFlowNodeInstance.isSuspended = dataModel.isSuspended;

    const processToken: Runtime.Types.ProcessToken = this._convertProcessTokenToRuntimeObject(dataModel.processToken);

    runtimeFlowNodeInstance.token = processToken;

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
    processToken.payload = dataModel.payload ? JSON.parse(dataModel.payload) : {};

    return processToken;
  }
}
