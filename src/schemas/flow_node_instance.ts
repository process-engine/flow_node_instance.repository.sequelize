import * as Sequelize from 'sequelize';
import {ProcessToken} from './process_token';

import {Runtime} from '@process-engine/process_engine_contracts';

export interface IFlowNodeInstanceAttributes {
  id: string;
  flowNodeInstanceId: string;
  flowNodeId: string;
  flowNodeType: string;
  state: Runtime.Types.FlowNodeInstanceState;
  error?: string;
  eventType?: string;
  // Contains the association to the ProcessToken model.
  // Must be optional, otherwise this property will be expected in the attribute payload of `sequelize.define`.
  processTokens?: Array<ProcessToken>;
  // The ID of the FNI that was executed before.
  // Will only be undefined for StartEvents.
  previousFlowNodeInstanceId?: string;
}

export type FlowNodeInstance = Sequelize.Instance<IFlowNodeInstanceAttributes> & IFlowNodeInstanceAttributes;

export function defineFlowNodeInstance(sequelize: Sequelize.Sequelize): Sequelize.Model<FlowNodeInstance, IFlowNodeInstanceAttributes> {

  const attributes: SequelizeAttributes<IFlowNodeInstanceAttributes> = {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
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
    eventType: {
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
