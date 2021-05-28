import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Mixed } from 'mongoose';

@Schema()
export class Settings extends Document {
  @Prop()
  id: string;

  @Prop({ type: Schema })
  settings: Mixed;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);

// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { ObjectId } from 'mongodb';
// import { Document } from 'mongoose';

// @Schema()
// export class Settings extends Document {
//   @Prop()
//   _id: ObjectId;

//   @Prop()
//   id: string;

//   @Prop()
//   more: string;

//   @Prop()
//   settings: Record<string, unknown>;

// }

// export const SettingsSchema = SchemaFactory.createForClass(Settings);
