import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DafAmudMappingDocument = DafAmudMapping & Document;

@Schema({ collection: 'daf_amud_mappings' })
export class DafAmudMapping {
  @Prop({ required: true, index: true })
  tractate: string; // Hebrew name (e.g., 'ברכות')

  @Prop({ required: true, index: true })
  daf: string; // Hebrew letter (e.g., 'ב')

  @Prop({ required: true, index: true })
  amud: string; // Hebrew letter (e.g., 'א')

  @Prop({ required: true })
  chapter: string; // Zero-padded (e.g., '001')

  @Prop({ required: true })
  halacha: string; // Zero-padded (e.g., '001')

  @Prop({ required: true })
  system_line: string; // Zero-padded (e.g., '00001')
}

export const DafAmudMappingSchema = SchemaFactory.createForClass(DafAmudMapping);

// Create compound index for efficient lookups
DafAmudMappingSchema.index({ tractate: 1, daf: 1, amud: 1 });
DafAmudMappingSchema.index({ tractate: 1, chapter: 1, halacha: 1, system_line: 1 });
