import {
  AllowNull, Column, CreatedAt, DataType, HasMany, Model, Table, Unique, UpdatedAt,
} from 'sequelize-typescript';

import {FlowNodeInstanceState} from '@process-engine/flow_node_instance.contracts';

import {ProcessTokenModel} from './process_token';

@Table({modelName: 'FlowNodeInstance', tableName: 'FlowNodeInstances'})
export class FlowNodeInstanceModel extends Model<FlowNodeInstanceModel> {

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  public flowNodeInstanceId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public flowNodeId: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  public flowNodeType: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  public eventType: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  public correlationId: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  public processModelId: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  public processInstanceId: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  public parentProcessInstanceId: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  public identity: string;

  @AllowNull(false)
  @Column({type: DataType.TEXT, defaultValue: 'finished'})
  public state: FlowNodeInstanceState;

  @AllowNull(true)
  @Column(DataType.TEXT)
  public error: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  public previousFlowNodeInstanceId: string;

  @HasMany((): typeof ProcessTokenModel => ProcessTokenModel, {
    as: 'processTokens',
    foreignKey: 'flowNodeInstanceId',
    sourceKey: 'flowNodeInstanceId',
  })
  public processTokens: Array<ProcessTokenModel>;

  @CreatedAt
  public createdAt?: Date;

  @UpdatedAt
  public updatedAt?: Date;

}
