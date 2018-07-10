import {getConnection} from '@essential-projects/sequelize_connection_manager';
import {IFlowNodeInstanceRepository, Runtime} from '@process-engine/process_engine_contracts';

import * as Sequelize from 'sequelize';

import {loadModels} from './model_loader';
import {FlowNodeInstance as FlowNodeInstanceModel, ProcessToken} from './schemas';

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

  private _flowNodeInstanceModel: FlowNodeInstanceModel;

  private sequelize: Sequelize.Sequelize;

  private flowNodeInstanceModel(): FlowNodeInstanceModel {
    return this._flowNodeInstanceModel;
  }

  public async initialize(): Promise<void> {
    this.sequelize = await getConnection(this.config.database, this.config.username, this.config.password, this.config);
    await loadModels(this.sequelize);
  }

  public async queryByCorrelation(correlationId: string): Promise<Array<Runtime.Types.FlowNodeInstance>> {
    throw new Error('Not implemented.');
  }

  public async queryByProcessModel(processModelId: string): Promise<Array<Runtime.Types.FlowNodeInstance>> {
    throw new Error('Not implemented.');
  }

  public async querySuspendedByCorrelation(correlationId: string): Promise<Array<Runtime.Types.FlowNodeInstance>> {
    throw new Error('Not implemented.');
  }

  public async querySuspendedByProcessModel(processModelId: string): Promise<Array<Runtime.Types.FlowNodeInstance>> {
    throw new Error('Not implemented.');
  }

  public async persistOnEnter(token: Runtime.Types.ProcessToken,
                              flowNodeId: string,
                              flowNodeInstanceId: string): Promise<Runtime.Types.FlowNodeInstance> {

    throw new Error('Not implemented.');
  }

  public async persistOnExit(token: Runtime.Types.ProcessToken,
                             flowNodeId: string,
                             flowNodeInstanceId: string): Promise<Runtime.Types.FlowNodeInstance> {
    throw new Error('Not implemented.');
  }

  public async suspend(token: Runtime.Types.ProcessToken,
                       flowNodeInstanceId: string,
                       correlationHash?: string): Promise<Runtime.Types.FlowNodeInstance> {
    throw new Error('Not implemented.');
  }

  public async resume(flowNodeInstanceId: string): Promise<Runtime.Types.FlowNodeInstance> {
    throw new Error('Not implemented.');
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
