import {Logger} from 'loggerhythm';

import {DestroyOptions, Op as Operators, Transaction} from 'sequelize';
import {Sequelize, SequelizeOptions} from 'sequelize-typescript';

import {IDisposable} from '@essential-projects/bootstrapper_contracts';
import {BaseError, NotFoundError, isEssentialProjectsError} from '@essential-projects/errors_ts';
import {SequelizeConnectionManager} from '@essential-projects/sequelize_connection_manager';
import {
  BpmnType,
  EventType,
  FlowNode,
  FlowNodeInstance,
  FlowNodeInstanceState,
  IFlowNodeInstanceRepository,
  ProcessToken,
  ProcessTokenType,
} from '@process-engine/flow_node_instance.contracts';

import {
  FlowNodeInstanceModel,
  ProcessTokenModel,
} from './schemas';

const logger: Logger = new Logger('processengine:persistence:flow_node_instance_repository');

export class FlowNodeInstanceRepository implements IFlowNodeInstanceRepository, IDisposable {

  public config: SequelizeOptions;

  private sequelizeInstance: Sequelize;
  private connectionManager: SequelizeConnectionManager;

  constructor(connectionManager: SequelizeConnectionManager) {
    this.connectionManager = connectionManager;
  }

  public async initialize(): Promise<void> {
    logger.verbose('Initializing Sequelize connection and loading models...');
    const connectionAlreadyEstablished = this.sequelizeInstance !== undefined;
    if (connectionAlreadyEstablished) {
      logger.verbose('Repository already initialized. Done.');

      return;
    }
    this.sequelizeInstance = await this.connectionManager.getConnection(this.config);

    this.sequelizeInstance.addModels([ProcessTokenModel, FlowNodeInstanceModel]);
    await this.sequelizeInstance.sync();

    logger.verbose('Done.');
  }

  public async dispose(): Promise<void> {
    logger.verbose('Disposing connection');
    await this.connectionManager.destroyConnection(this.config);
    this.sequelizeInstance = undefined;
    logger.verbose('Done.');
  }

  public async querySpecificFlowNode(correlationId: string, processModelId: string, flowNodeId: string): Promise<FlowNodeInstance> {
    const result = await FlowNodeInstanceModel.findOne({
      where: {
        correlationId: correlationId,
        processModelId: processModelId,
        flowNodeId: flowNodeId,
      },
      include: [{
        model: ProcessTokenModel,
        as: 'processTokens',
        required: true,
      }],
    });

    const flowNodeInstanceNotFound = !result;
    if (flowNodeInstanceNotFound) {
      throw new NotFoundError(`FlowNodeInstance with flowNodeId "${flowNodeId}" does not exist.`);
    }

    const flowNodeInstance = this.convertFlowNodeInstanceToRuntimeObject(result);

    return flowNodeInstance;
  }

  public async queryFlowNodeInstancesByProcessInstanceId(processInstanceId: string, flowNodeId: string): Promise<Array<FlowNodeInstance>> {
    const results = await FlowNodeInstanceModel.findAll({
      where: {
        processInstanceId: processInstanceId,
        flowNodeId: flowNodeId,
      },
      include: [{
        model: ProcessTokenModel,
        as: 'processTokens',
        required: true,
      }],
      order: [
        ['processTokens', 'createdAt'],
      ],
    });

    const flowNodeInstances = results.map<FlowNodeInstance>(this.convertFlowNodeInstanceToRuntimeObject.bind(this));

    return flowNodeInstances;
  }

  public async queryByFlowNodeId(flowNodeId: string): Promise<Array<FlowNodeInstance>> {
    const results = await FlowNodeInstanceModel.findAll({
      where: {
        flowNodeId: flowNodeId,
      },
      include: [{
        model: ProcessTokenModel,
        as: 'processTokens',
        required: true,
      }],
      order: [
        ['id', 'ASC'],
      ],
    });

    const flowNodeInstances = results.map<FlowNodeInstance>(this.convertFlowNodeInstanceToRuntimeObject.bind(this));

    return flowNodeInstances;
  }

  public async queryByInstanceId(flowNodeInstanceId: string): Promise<FlowNodeInstance> {
    const matchingFlowNodeInstance = await FlowNodeInstanceModel.findOne({
      where: {
        flowNodeInstanceId: flowNodeInstanceId,
      },
      include: [{
        model: ProcessTokenModel,
        as: 'processTokens',
        required: true,
      }],
    });

    if (!matchingFlowNodeInstance) {
      throw new NotFoundError(`FlowNodeInstance with flowNodeInstanceId "${flowNodeInstanceId}" does not exist.`);
    }

    const runtimeFlowNodeInstance = this.convertFlowNodeInstanceToRuntimeObject(matchingFlowNodeInstance);

    return runtimeFlowNodeInstance;
  }

  public async queryActive(): Promise<Array<FlowNodeInstance>> {

    const results = await FlowNodeInstanceModel.findAll({
      where: {
        state: {
          [Operators.in]: [FlowNodeInstanceState.suspended, FlowNodeInstanceState.running],
        },
      },
      include: [{
        model: ProcessTokenModel,
        as: 'processTokens',
        required: true,
      }],
    });

    const runtimeFlowNodeInstances = results.map<FlowNodeInstance>(this.convertFlowNodeInstanceToRuntimeObject.bind(this));

    return runtimeFlowNodeInstances;
  }

  public async queryActiveByProcessInstance(processInstanceId: string): Promise<Array<FlowNodeInstance>> {

    const results = await FlowNodeInstanceModel.findAll({
      where: {
        processInstanceId: processInstanceId,
        state: {
          [Operators.in]: [FlowNodeInstanceState.suspended, FlowNodeInstanceState.running],
        },
      },
      include: [{
        model: ProcessTokenModel,
        as: 'processTokens',
        required: true,
      }],
    });

    const runtimeFlowNodeInstances = results.map<FlowNodeInstance>(this.convertFlowNodeInstanceToRuntimeObject.bind(this));

    return runtimeFlowNodeInstances;
  }

  public async queryActiveByCorrelationAndProcessModel(
    correlationId: string,
    processModelId: string,
  ): Promise<Array<FlowNodeInstance>> {

    const results = await FlowNodeInstanceModel.findAll({
      where: {
        correlationId: correlationId,
        processModelId: processModelId,
        state: {
          [Operators.in]: [FlowNodeInstanceState.suspended, FlowNodeInstanceState.running],
        },
      },
      include: [{
        model: ProcessTokenModel,
        as: 'processTokens',
        required: true,
      }],
    });

    const flowNodeInstances = results.map<FlowNodeInstance>(this.convertFlowNodeInstanceToRuntimeObject.bind(this));

    return flowNodeInstances;
  }

  public async queryByState(state: FlowNodeInstanceState): Promise<Array<FlowNodeInstance>> {

    const results = await FlowNodeInstanceModel.findAll({
      where: {
        state: state,
      },
      include: [{
        model: ProcessTokenModel,
        as: 'processTokens',
        required: true,
      }],
      order: [
        ['id', 'ASC'],
      ],
    });
    const flowNodeInstances = results.map<FlowNodeInstance>(this.convertFlowNodeInstanceToRuntimeObject.bind(this));

    return flowNodeInstances;
  }

  public async queryByCorrelation(correlationId: string): Promise<Array<FlowNodeInstance>> {

    const results = await FlowNodeInstanceModel.findAll({
      where: {
        correlationId: correlationId,
      },
      include: [{
        model: ProcessTokenModel,
        as: 'processTokens',
        required: true,
      }],
      order: [
        ['id', 'ASC'],
      ],
    });

    const flowNodeInstances = results.map<FlowNodeInstance>(this.convertFlowNodeInstanceToRuntimeObject.bind(this));

    return flowNodeInstances;
  }

  public async queryByProcessModel(processModelId: string): Promise<Array<FlowNodeInstance>> {

    const results = await FlowNodeInstanceModel.findAll({
      where: {
        processModelId: processModelId,
      },
      include: [{
        model: ProcessTokenModel,
        as: 'processTokens',
        required: true,
      }],
      order: [
        ['id', 'ASC'],
      ],
    });

    const flowNodeInstances = results.map<FlowNodeInstance>(this.convertFlowNodeInstanceToRuntimeObject.bind(this));

    return flowNodeInstances;
  }

  public async queryByCorrelationAndProcessModel(correlationId: string, processModelId: string): Promise<Array<FlowNodeInstance>> {

    const results = await FlowNodeInstanceModel.findAll({
      where: {
        correlationId: correlationId,
        processModelId: processModelId,
      },
      include: [{
        model: ProcessTokenModel,
        as: 'processTokens',
        required: true,
      }],
    });

    const flowNodeInstances = results.map<FlowNodeInstance>(this.convertFlowNodeInstanceToRuntimeObject.bind(this));

    return flowNodeInstances;
  }

  public async querySuspendedByCorrelation(correlationId: string): Promise<Array<FlowNodeInstance>> {

    const results = await FlowNodeInstanceModel.findAll({
      where: {
        correlationId: correlationId,
        state: FlowNodeInstanceState.suspended,
      },
      include: [{
        model: ProcessTokenModel,
        as: 'processTokens',
        required: true,
      }],
      order: [
        ['id', 'ASC'],
      ],
    });

    const flowNodeInstances = results.map<FlowNodeInstance>(this.convertFlowNodeInstanceToRuntimeObject.bind(this));

    return flowNodeInstances;
  }

  public async querySuspendedByProcessModel(processModelId: string): Promise<Array<FlowNodeInstance>> {

    const results = await FlowNodeInstanceModel.findAll({
      where: {
        processModelId: processModelId,
        state: FlowNodeInstanceState.suspended,
      },
      include: [{
        model: ProcessTokenModel,
        as: 'processTokens',
        required: true,
      }],
      order: [
        ['id', 'ASC'],
      ],
    });

    const flowNodeInstances = results.map<FlowNodeInstance>(this.convertFlowNodeInstanceToRuntimeObject.bind(this));

    return flowNodeInstances;
  }

  public async querySuspendedByProcessInstance(processInstanceId: string): Promise<Array<FlowNodeInstance>> {

    const results = await FlowNodeInstanceModel.findAll({
      where: {
        processInstanceId: processInstanceId,
        state: FlowNodeInstanceState.suspended,
      },
      include: [{
        model: ProcessTokenModel,
        as: 'processTokens',
        required: true,
      }],
      order: [
        ['id', 'ASC'],
      ],
    });

    const flowNodeInstances = results.map<FlowNodeInstance>(this.convertFlowNodeInstanceToRuntimeObject.bind(this));

    return flowNodeInstances;
  }

  public async queryProcessTokensByProcessInstanceId(processInstanceId: string): Promise<Array<ProcessToken>> {

    const results = await FlowNodeInstanceModel.findAll({
      where: {
        processInstanceId: processInstanceId,
      },
      include: [{
        model: ProcessTokenModel,
        as: 'processTokens',
        required: true,
      }],
      order: [
        ['id', 'ASC'],
      ],
    });

    const processTokens: Array<ProcessToken> = [];

    results.forEach((flowNodeInstance: FlowNodeInstanceModel): void => {
      const instanceProcessTokens = flowNodeInstance.processTokens;

      instanceProcessTokens.forEach((token: ProcessTokenModel): void => {
        const runtimeProcessToken = this.convertProcessTokenToRuntimeObject(token, flowNodeInstance);

        processTokens.push(runtimeProcessToken);
      });
    });

    return processTokens;
  }

  public async queryByProcessInstance(processInstanceId: string): Promise<Array<FlowNodeInstance>> {

    const results = await FlowNodeInstanceModel.findAll({
      where: {
        processInstanceId: processInstanceId,
      },
      include: [{
        model: ProcessTokenModel,
        as: 'processTokens',
        required: true,
      }],
      order: [
        ['id', 'ASC'],
      ],
    });

    const flowNodeInstances = results.map<FlowNodeInstance>(this.convertFlowNodeInstanceToRuntimeObject.bind(this));

    return flowNodeInstances;
  }

  public async deleteByProcessModelId(processModelId: string): Promise<void> {

    const flowNodeInstancesToRemove = await this.queryByProcessModel(processModelId);
    const flowNodeInstanceIdsToRemove = flowNodeInstancesToRemove.map(((flowNodeInstance: FlowNodeInstance): string => {
      return flowNodeInstance.id;
    }));

    await this.sequelizeInstance.transaction(async (deleteTransaction: Transaction): Promise<void> => {
      const flowNodeQueryParams: DestroyOptions = {
        where: {
          flowNodeInstanceId: {
            [Operators.in]: flowNodeInstanceIdsToRemove,
          },
        },
        transaction: deleteTransaction,
      };

      const processTokenQueryParams: DestroyOptions = {
        where: {
          flowNodeInstanceId: {
            [Operators.in]: flowNodeInstanceIdsToRemove,
          },
        },
        transaction: deleteTransaction,
      };

      await ProcessTokenModel.destroy(processTokenQueryParams);
      await FlowNodeInstanceModel.destroy(flowNodeQueryParams);
    });
  }

  public async persistOnEnter(
    flowNode: FlowNode,
    flowNodeInstanceId: string,
    processToken: ProcessToken,
    previousFlowNodeInstanceId: string,
  ): Promise<FlowNodeInstance> {

    const createParams = {
      flowNodeInstanceId: flowNodeInstanceId,
      flowNodeId: flowNode.id,
      flowNodeType: flowNode.bpmnType,
      eventType: (flowNode as any).eventType,
      correlationId: processToken.correlationId,
      processModelId: processToken.processModelId,
      processInstanceId: processToken.processInstanceId,
      identity: JSON.stringify(processToken.identity),
      parentProcessInstanceId: processToken.caller,
      state: FlowNodeInstanceState.running,
      previousFlowNodeInstanceId: previousFlowNodeInstanceId,
    };

    const initialState = ProcessTokenType.onEnter;
    const matchingFlowNodeInstance = await FlowNodeInstanceModel.findOne({
      where: {
        flowNodeInstanceId: flowNodeInstanceId,
      },
    });

    const createTransaction = await this.sequelizeInstance.transaction();
    try {
      // Workaround for solving the Problem with multiple previousFlowNodeInstanceIds for ParallelJoinGateways.
      if (matchingFlowNodeInstance) {
        matchingFlowNodeInstance.previousFlowNodeInstanceId = previousFlowNodeInstanceId;
        await matchingFlowNodeInstance.save({transaction: createTransaction});

      } else {

        await FlowNodeInstanceModel.create(createParams, {transaction: createTransaction});
        await this.createProcessTokenForFlowNodeInstance(flowNodeInstanceId, processToken, initialState, createTransaction);
      }

      await createTransaction.commit();

      return this.queryByInstanceId(flowNodeInstanceId);
    } catch (error) {
      logger.error(`Failed to persist new instance for FlowNode ${flowNode.id}, using instance id ${flowNodeInstanceId}!`, error);

      await createTransaction.rollback();

      throw error;
    }
  }

  public async persistOnExit(
    flowNode: FlowNode,
    flowNodeInstanceId: string,
    processToken: ProcessToken,
  ): Promise<FlowNodeInstance> {

    const flowNodeInstanceState = FlowNodeInstanceState.finished;
    const processTokenType = ProcessTokenType.onExit;

    return this.persistOnStateChange(flowNode.id, flowNodeInstanceId, processToken, flowNodeInstanceState, processTokenType);
  }

  public async persistOnError(
    flowNode: FlowNode,
    flowNodeInstanceId: string,
    processToken: ProcessToken,
    error: Error,
  ): Promise<FlowNodeInstance> {

    const flowNodeInstanceState = FlowNodeInstanceState.error;
    const processTokenType = ProcessTokenType.onExit;

    return this.persistOnStateChange(flowNode.id, flowNodeInstanceId, processToken, flowNodeInstanceState, processTokenType, error);
  }

  public async persistOnTerminate(
    flowNode: FlowNode,
    flowNodeInstanceId: string,
    processToken: ProcessToken,
  ): Promise<FlowNodeInstance> {

    const flowNodeInstanceState = FlowNodeInstanceState.terminated;
    const processTokenType = ProcessTokenType.onExit;

    return this.persistOnStateChange(flowNode.id, flowNodeInstanceId, processToken, flowNodeInstanceState, processTokenType);
  }

  public async suspend(
    flowNodeId: string,
    flowNodeInstanceId: string,
    processToken: ProcessToken,
  ): Promise<FlowNodeInstance> {

    const flowNodeInstanceState = FlowNodeInstanceState.suspended;
    const processTokenType = ProcessTokenType.onSuspend;

    return this.persistOnStateChange(flowNodeId, flowNodeInstanceId, processToken, flowNodeInstanceState, processTokenType);
  }

  public async resume(
    flowNodeId: string,
    flowNodeInstanceId: string,
    processToken: ProcessToken,
  ): Promise<FlowNodeInstance> {

    const flowNodeInstanceState = FlowNodeInstanceState.running;
    const processTokenType = ProcessTokenType.onResume;

    return this.persistOnStateChange(flowNodeId, flowNodeInstanceId, processToken, flowNodeInstanceState, processTokenType);
  }

  private async persistOnStateChange(
    flowNodeId: string,
    flowNodeInstanceId: string,
    token: ProcessToken,
    newState: FlowNodeInstanceState,
    processTokenType: ProcessTokenType,
    error?: Error,
  ): Promise<FlowNodeInstance> {

    const matchingFlowNodeInstance = await FlowNodeInstanceModel.findOne({
      where: {
        flowNodeId: flowNodeId,
        flowNodeInstanceId: flowNodeInstanceId,
      },
    });

    const noFlowNodeInstanceFound = !matchingFlowNodeInstance;
    if (noFlowNodeInstanceFound) {
      throw new Error(`flow node with instance id '${flowNodeInstanceId}' not found!`);
    }

    matchingFlowNodeInstance.state = newState;

    const stateChangeHasErrorAttached = error !== undefined;
    if (stateChangeHasErrorAttached) {
      matchingFlowNodeInstance.error = this.serializeError(error);
    }

    const createTransaction = await this.sequelizeInstance.transaction();
    try {
      await matchingFlowNodeInstance.save({transaction: createTransaction});
      await this.createProcessTokenForFlowNodeInstance(flowNodeInstanceId, token, processTokenType, createTransaction);
      await createTransaction.commit();

      const updatedFlowNodeInstance = await this.queryByInstanceId(flowNodeInstanceId);

      return updatedFlowNodeInstance;
    } catch (persistenceError) {
      logger.error(
        `Failed to change state of FlowNode ${flowNodeId} with instance ID ${flowNodeInstanceId} to '${newState}'!`,
        token, persistenceError,
      );

      await createTransaction.rollback();

      throw persistenceError;
    }
  }

  private async createProcessTokenForFlowNodeInstance(
    flowNodeInstanceId: string,
    token: ProcessToken,
    type: ProcessTokenType,
    createTransaction: Transaction,
  ): Promise<void> {

    const createParams = {
      type: type,
      payload: JSON.stringify(token.payload),
      flowNodeInstanceId: flowNodeInstanceId,
    };

    await ProcessTokenModel.create(createParams, {transaction: createTransaction});
  }

  private serializeError(error: Error | string): string {

    const errorIsFromEssentialProjects = isEssentialProjectsError(error);
    if (errorIsFromEssentialProjects) {
      return (error as BaseError).serialize();
    }

    const errorIsString = typeof error === 'string';
    if (errorIsString) {
      return error as string;
    }

    return JSON.stringify(error);
  }

  private convertFlowNodeInstanceToRuntimeObject(dataModel: FlowNodeInstanceModel): FlowNodeInstance {

    const runtimeFlowNodeInstance = new FlowNodeInstance();
    runtimeFlowNodeInstance.id = dataModel.flowNodeInstanceId;
    runtimeFlowNodeInstance.flowNodeId = dataModel.flowNodeId;
    runtimeFlowNodeInstance.flowNodeType = <BpmnType> dataModel.flowNodeType;
    runtimeFlowNodeInstance.eventType = <EventType> dataModel.eventType;
    runtimeFlowNodeInstance.correlationId = dataModel.correlationId;
    runtimeFlowNodeInstance.processModelId = dataModel.processModelId;
    runtimeFlowNodeInstance.processInstanceId = dataModel.processInstanceId;
    runtimeFlowNodeInstance.state = dataModel.state;
    runtimeFlowNodeInstance.owner = dataModel.identity ? this.tryParse(dataModel.identity) : {};
    runtimeFlowNodeInstance.parentProcessInstanceId = dataModel.parentProcessInstanceId;
    runtimeFlowNodeInstance.previousFlowNodeInstanceId = dataModel.previousFlowNodeInstanceId;

    const dataModelHasError = dataModel.error !== undefined;
    if (dataModelHasError) {

      const essentialProjectsError = this.tryDeserializeEssentialProjectsError(dataModel.error);

      const errorIsFromEssentialProjects = essentialProjectsError !== undefined;

      runtimeFlowNodeInstance.error = errorIsFromEssentialProjects
        ? essentialProjectsError
        : this.tryParse(dataModel.error);
    }

    const processTokens = dataModel.processTokens.map((currentToken: ProcessTokenModel): ProcessToken => {
      return this.convertProcessTokenToRuntimeObject(currentToken, dataModel);
    });

    runtimeFlowNodeInstance.tokens = processTokens;

    return runtimeFlowNodeInstance;
  }

  private convertProcessTokenToRuntimeObject(dataModel: ProcessTokenModel, flowNodeInstance: FlowNodeInstanceModel): ProcessToken {

    const processToken = new ProcessToken();
    processToken.flowNodeInstanceId = dataModel.flowNodeInstanceId;
    processToken.createdAt = dataModel.createdAt;
    processToken.type = ProcessTokenType[dataModel.type];
    processToken.payload = dataModel.payload ? this.tryParse(dataModel.payload) : {};

    processToken.processInstanceId = flowNodeInstance.processInstanceId;
    processToken.processModelId = flowNodeInstance.processModelId;
    processToken.correlationId = flowNodeInstance.correlationId;
    processToken.identity = flowNodeInstance.identity ? this.tryParse(flowNodeInstance.identity) : {};
    processToken.caller = flowNodeInstance.parentProcessInstanceId;

    return processToken;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tryParse(value: string): any {
    try {
      return JSON.parse(value);
    } catch (error) {
      // Value is not a JSON - return it as it is.
      return value;
    }
  }

  private tryDeserializeEssentialProjectsError(value: string): Error {
    try {
      return BaseError.deserialize(value);
    } catch (error) {
      return undefined;
    }
  }

}
