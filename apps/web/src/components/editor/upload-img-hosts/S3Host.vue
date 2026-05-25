<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup'
import { Field, Form } from 'vee-validate'
import * as yup from 'yup'
import { secureStore } from '@/utils/secureStore'
import { toast } from '@/utils/toast'

const schema = toTypedSchema(yup.object({
  endpoint: yup.string().optional(),
  region: yup.string().required(`Region 不能为空`),
  bucket: yup.string().required(`Bucket 不能为空`),
  accessKeyId: yup.string().required(`AccessKey ID 不能为空`),
  accessKeySecret: yup.string().required(`Secret AccessKey 不能为空`),
  path: yup.string().optional(),
  cdnHost: yup.string().optional(),
  pathStyle: yup.boolean().optional(),
}))

const config = secureStore.reactiveJSON(`s3Config`, {
  endpoint: ``,
  region: ``,
  bucket: ``,
  accessKeyId: ``,
  accessKeySecret: ``,
  path: ``,
  cdnHost: ``,
  pathStyle: false,
})

async function onSubmit(values: any) {
  Object.assign(config.value, values)
  toast.success(`保存成功`)
}
</script>

<template>
  <Form :validation-schema="schema" :initial-values="config" class="flex flex-col flex-1 overflow-hidden" @submit="onSubmit">
    <div class="flex-1 overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <Field v-slot="{ field, errorMessage }" name="endpoint">
        <FormItem label="Endpoint" :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：s3.amazonaws.com，可不填" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="region">
        <FormItem label="Region" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：us-east-1" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="bucket">
        <FormItem label="Bucket" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：bucket-name" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="accessKeyId">
        <FormItem label="AccessKey ID" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：AKIAIOSFODNN7EXAMPLE" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="accessKeySecret">
        <FormItem label="AccessKey Secret" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" type="password" placeholder="如：wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="path">
        <FormItem label="存储路径" :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：img，可不填，默认根目录" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="cdnHost">
        <FormItem label="自定义域名" :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：https://cdn.example.com" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="pathStyle" type="boolean">
        <FormItem label="Force Path Style" :error="errorMessage">
          <Switch
            :checked="field.value"
            :name="field.name"
            @update:checked="field.onChange"
            @blur="field.onBlur"
          />
        </FormItem>
      </Field>
    </div>

    <DialogFooter class="p-1">
      <Button type="submit">
        保存配置
      </Button>
    </DialogFooter>
  </Form>
</template>
