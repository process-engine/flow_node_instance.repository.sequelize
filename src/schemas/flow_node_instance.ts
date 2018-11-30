import * as Sequelize from 'sequelize';
import {ProcessToken} from './process_token';

import {Runtime} from '@process-engine/process_engine_contracts';

export interface IFlowNodeInstanceAttributes {
  flowNodeInstanceId: string;
  flowNodeId: string;
  flowNodeType: string;
  eventType?: string;
  correlationId: string;
  processModelId: string;
  processInstanceId: string;
  identity: object;
  parentProcessInstanceId?: "string";
  state: Runtime.Types.FlowNodeInstanceState;
  error?: string;
  // Contains the association to the ProcessToken model.
  // Must be optional, otherwise this property will be expected in the attribute payload of `sequelize.define`.
  processTokens?: Array<ProcessToken>;
  // The ID of the FlowNodeInstance that was executed before.
  // Will only be undefined for StartEvents.
  previousFlowNodeInstanceId?: string;
}

export type FlowNodeInstance = Sequelize.Instance<IFlowNodeInstanceAttributes> & IFlowNodeInstanceAttributes;

export function defineFlowNodeInstance(sequelize: Sequelize.Sequelize): Sequelize.Model<FlowNodeInstance, IFlowNodeInstanceAttributes> {

  const attributes: SequelizeAttributes<IFlowNodeInstanceAttributes> = {
    flowNodeInstanceId: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    flowNodeId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    flowNodeType: {
      type: Sequelize.STRING,
      allowNull: true, // With regards to old databases, null values must be allowed here
    },
    eventType: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    correlationId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    processModelId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    processInstanceId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    parentProcessInstanceId: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    identity: {
      // Since the identity is also a serialised object, we should use TEXT instead of string here.
      // See ProcessToken.Payload.
      type: Sequelize.TEXT,
      allowNull: false,
    },
    state: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 0,
    },
    error: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    previousFlowNodeInstanceId: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  };

  return sequelize.define<FlowNodeInstance, IFlowNodeInstanceAttributes>('FlowNodeInstance', attributes);
}
