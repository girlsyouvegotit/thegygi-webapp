import {
  type Control,
  Controller,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface CustomInputProps<T extends FieldValues>
  extends Omit<ComponentProps<typeof Input>, "name"> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: string;
  descriptionClassName?: string;
}

export function CustomInput<T extends FieldValues>({
  control,
  name,
  label,
  description,
  descriptionClassName,
  ...props
}: CustomInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>{label}</FieldLabel>
          <Input {...field} {...props} />

          {description && (
            <p
              className={cn(
                "text-[11px] leading-snug text-muted-foreground sm:text-xs sm:leading-relaxed",
                descriptionClassName,
              )}
            >
              {description}
            </p>
          )}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
