import * as Sequelize from 'sequelize';

interface ProcessTokenAttributes {
  id: string;
  processInstanceId: string;
  processModelId: string;
  correlationId: string;
  identity: string; // Contains the stringified IIdentity
  createdAt: Date;
  caller?: string; // Only set, if the process token belongs to a subprocess
  payload: string; // Contains the stringified payload
}

type ProcessToken = Sequelize.Instance<ProcessTokenAttributes> & ProcessTokenAttributes;

export function sequelizeProcessToken(sequelize: Sequelize.Sequelize): any {
  const attributes: SequelizeAttributes<ProcessTokenAttributes> = {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    processInstanceId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    processModelId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    correlationId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    identity: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    caller: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    payload: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  };

  return sequelize.define<ProcessToken, ProcessTokenAttributes>('ProcessToken', attributes);
}
