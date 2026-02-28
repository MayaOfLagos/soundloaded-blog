/**
 * Field component shim for uselayouts compatibility.
 * Maps Field* names to shadcn FormItem equivalents.
 */
export {
  FormItem as Field,
  FormLabel as FieldLabel,
  FormDescription as FieldDescription,
  FormMessage as FieldError,
} from "@/components/ui/form";
