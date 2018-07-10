import {getConnection} from '@essential-projects/sequelize_connection_manager';
import {IFlowNodeInstanceRepository, Runtime} from '@process-engine/process_engine_contracts';

import * as Sequelize from 'sequelize';

import {loadModels} from './model_loader';
import {
  FlowNodeInstance as FlowNodeInstanceModel,
  IFlowNodeInstanceAttributes,
  IProcessTokenAttributes,
  ProcessToken,
} from './schemas';

export class FlowNodeInstanceRepository implements IFlowNodeInstanceRepository {

  public config: any;
  // {
  //   "username": "admin",
  //   "password": "admin",
  //   "database": "processengine",
  //   "host": "localhost",
  //   "port": 45678,
  //   "dialect": "postgres",
  //   "supportBigNumbers": true,
  //   "resetPasswordRequestTimeToLive": 12
  // }

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
    this.sequelize = await getConnection(this.config.database, this.config.username, this.config.password, this.config);
    await loadModels(this.sequelize);

    this._flowNodeInstanceModel = this.sequelize.models.FlowNodeInstance;
    this._processTokenModel = this.sequelize.models.ProcessToken;
  }

  public async persistOnEnter(token: Runtime.Types.ProcessToken,
                              flowNodeId: string,
                              flowNodeInstanceId: string): Promise<Runtime.Types.FlowNodeInstance> {

    const persistableToken: any = Object.assign({}, token);
    persistableToken.identity = JSON.stringify(token.identity);

    const createParams: any = {
      flowNodeId: flowNodeId,
      instanceId: flowNodeInstanceId,
      isSuspended: false,
      processToken: persistableToken,
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

    const matchingFlowNodeInstance: FlowNodeInstanceModel = await this.flowNodeInstanceModel.findOne({
      where: {
        flowNodeId: flowNodeId,
        instanceId: flowNodeInstanceId,
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

    const currentToken: ProcessToken = (matchingFlowNodeInstance as any).processToken;
    const updatedToken: ProcessToken = Object.assign(currentToken, newProcessToken);
    updatedToken.identity = JSON.stringify(newProcessToken.identity);

    (matchingFlowNodeInstance as any).processToken = updatedToken;
    matchingFlowNodeInstance.save();
    const runtimeFlowNodeInstance: Runtime.Types.FlowNodeInstance = this._convertFlowNodeInstanceToRuntimeObject(matchingFlowNodeInstance);

    return runtimeFlowNodeInstance;
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

    const flowNodeInstances: Array<Runtime.Types.FlowNodeInstance> = results.map(this._convertFlowNodeInstanceToRuntimeObject);

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

    const flowNodeInstances: Array<Runtime.Types.FlowNodeInstance> = results.map(this._convertFlowNodeInstanceToRuntimeObject);

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

    const flowNodeInstances: Array<Runtime.Types.FlowNodeInstance> = results.map(this._convertFlowNodeInstanceToRuntimeObject);

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

    const flowNodeInstances: Array<Runtime.Types.FlowNodeInstance> = results.map(this._convertFlowNodeInstanceToRuntimeObject);

    return flowNodeInstances;
  }

  public async suspend(newProcessToken: Runtime.Types.ProcessToken,
                       flowNodeInstanceId: string): Promise<Runtime.Types.FlowNodeInstance> {

    const matchingFlowNodeInstance: FlowNodeInstanceModel = await this.flowNodeInstanceModel.findOne({
      where: {
        instanceId: flowNodeInstanceId,
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

    const currentToken: ProcessToken = (matchingFlowNodeInstance as any).processToken;
    const updatedToken: ProcessToken = Object.assign(currentToken, newProcessToken);
    updatedToken.identity = JSON.stringify(newProcessToken.identity);

    (matchingFlowNodeInstance as any).processToken = updatedToken;
    matchingFlowNodeInstance.save();
    const runtimeFlowNodeInstance: Runtime.Types.FlowNodeInstance = this._convertFlowNodeInstanceToRuntimeObject(matchingFlowNodeInstance);

    return runtimeFlowNodeInstance;
  }

  public async resume(flowNodeInstanceId: string): Promise<Runtime.Types.FlowNodeInstance> {

    const matchingFlowNodeInstance: FlowNodeInstanceModel = await this.flowNodeInstanceModel.findOne({
      where: {
        instanceId: flowNodeInstanceId,
      },
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
    runtimeFlowNodeInstance.id = dataModel.instanceId;
    runtimeFlowNodeInstance.flowNodeId = dataModel.flowNodeId;
    runtimeFlowNodeInstance.isSuspended = dataModel.isSuspended;

    const processToken: Runtime.Types.ProcessToken = this._convertProcessTokenToRuntimeObject((dataModel as any).processToken);

    runtimeFlowNodeInstance.token = processToken;

    return runtimeFlowNodeInstance;
  }

  private _convertProcessTokenToRuntimeObject(dataModel: ProcessToken): Runtime.Types.ProcessToken {

    const processToken: Runtime.Types.ProcessToken = new Runtime.Types.ProcessToken();
    processToken.processInstanceId = dataModel.processInstanceId;
    processToken.processModelId = dataModel.processModelId;
    processToken.correlationId = dataModel.correlationId;
    processToken.identity = JSON.parse(dataModel.identity);
    processToken.createdAt = dataModel.createdAt;
    processToken.caller = dataModel.caller;
    processToken.payload = dataModel.payload;

    return processToken;
  }
}
