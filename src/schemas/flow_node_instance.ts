import {AllowNull, Column, CreatedAt, DataType, HasMany, Model, Table, Unique, UpdatedAt} from 'sequelize-typescript';

import {FlowNodeInstanceState} from '@process-engine/flow_node_instance.contracts';

import {ProcessTokenModel} from './process_token';

@Table({modelName: 'FlowNodeInstance', tableName: 'FlowNodeInstance', version: true})
export class FlowNodeInstanceModel extends Model<FlowNodeInstanceModel> {

  @AllowNull(false)
  @Unique
  @Column
  public flowNodeInstanceId: string;

  @AllowNull(false)
  @Column
  public flowNodeId: string;

  @AllowNull(true)
  @Column
  public flowNodeType: string;

  @AllowNull(true)
  @Column
  public eventType: string;

  @AllowNull(true)
  @Column
  public correlationId: string;

  @AllowNull(true)
  @Column
  public processModelId: string;

  @AllowNull(true)
  @Column
  public processInstanceId: string;

  @AllowNull(true)
  @Column
  public parentProcessInstanceId: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  public identity: string;

  @AllowNull(true)
  @Column({type: DataType.TEXT, defaultValue: 'finished'})
  public state: FlowNodeInstanceState;

  @AllowNull(true)
  @Column(DataType.TEXT)
  public error: string;

  @AllowNull(true)
  @Column
  public previousFlowNodeInstanceId: string;

  @HasMany(() => ProcessTokenModel)
  public processTokens: Array<ProcessTokenModel>;

  @CreatedAt
  public createdAt?: Date;

  @UpdatedAt
  public updatedAt?: Date;
}
