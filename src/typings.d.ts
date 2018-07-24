
declare module "readable-stream" {
  import * as s from "stream";
  export class Transform extends s.Transform { }
  export type TransformOptions=s.TransformOptions
  export class Readable extends s.Readable{}
}