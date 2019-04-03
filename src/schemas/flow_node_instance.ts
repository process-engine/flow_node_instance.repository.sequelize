import * as Sequelize from 'sequelize';
import {ProcessTokenModel} from './process_token';

import {FlowNodeInstanceState} from '@process-engine/flow_node_instance.contracts';

export interface IFlowNodeInstanceAttributes {
  flowNodeInstanceId: string;
  flowNodeId: string;
  flowNodeType: string;
  eventType?: string;
  correlationId: string;
  processModelId: string;
  processInstanceId: string;
  identity: string;
  parentProcessInstanceId?: string;
  state: FlowNodeInstanceState;
  error?: string;
  // Contains the association to the ProcessToken model.
  // Must be optional, otherwise this property will be expected in the attribute payload of `sequelize.define`.
  processTokens?: Array<ProcessTokenModel>;
  // The ID of the FlowNodeInstance that was executed before.
  // Will only be undefined for StartEvents.
  previousFlowNodeInstanceId?: string;
}

export type FlowNodeInstanceModel = Sequelize.Instance<IFlowNodeInstanceAttributes> & IFlowNodeInstanceAttributes;

export function defineFlowNodeInstance(sequelize: Sequelize.Sequelize): Sequelize.Model<FlowNodeInstanceModel, IFlowNodeInstanceAttributes> {

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
      allowNull: true,
    },
    processModelId: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    processInstanceId: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    parentProcessInstanceId: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    identity: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    state: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 0,
    },
    error: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    previousFlowNodeInstanceId: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  };

  return sequelize.define<FlowNodeInstanceModel, IFlowNodeInstanceAttributes>('FlowNodeInstance', attributes);
}
