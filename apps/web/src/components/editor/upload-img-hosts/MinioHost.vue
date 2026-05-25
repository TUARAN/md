<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup'
import { Field, Form } from 'vee-validate'
import * as yup from 'yup'
import { secureStore } from '@/utils/secureStore'
import { toast } from '@/utils/toast'

const schema = toTypedSchema(yup.object({
  endpoint: yup.string().required(`Endpoint 不能为空`),
  port: yup.string().optional(),
  useSSL: yup.boolean().required(),
  bucket: yup.string().required(`Bucket 不能为空`),
  accessKey: yup.string().required(`AccessKey 不能为空`),
  secretKey: yup.string().required(`SecretKey 不能为空`),
}))

const config = secureStore.reactiveJSON(`minioConfig`, {
  endpoint: ``,
  port: ``,
  useSSL: true,
  bucket: ``,
  accessKey: ``,
  secretKey: ``,
})

async function onSubmit(values: typeof config.value) {
  Object.assign(config.value, values)
  toast.success(`保存成功`)
}
</script>

<template>
  <Form :validation-schema="schema" :initial-values="config" class="flex flex-col flex-1 overflow-hidden" @submit="onSubmit">
    <div class="flex-1 overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <Field v-slot="{ field, errorMessage }" name="endpoint">
        <FormItem label="Endpoint" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：play.min.io" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="port">
        <FormItem label="Port" :error="errorMessage">
          <Input v-bind="field" v-model="field.value" type="number" placeholder="如：9000，可不填，http 默认为 80，https 默认为 443" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="useSSL" type="boolean">
        <FormItem label="UseSSL" required :error="errorMessage">
          <Switch
            :checked="field.value"
            :name="field.name"
            @update:checked="field.onChange"
            @blur="field.onBlur"
          />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="bucket">
        <FormItem label="Bucket" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：doocs" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="accessKey">
        <FormItem label="AccessKey" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：zhangsan" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="secretKey">
        <FormItem label="SecretKey" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：asdasdasd" />
        </FormItem>
      </Field>

      <FormItem>
        <Button
          variant="link"
          class="p-0 h-auto text-left whitespace-normal"
          as="a"
          href="http://docs.minio.org.cn/docs/master/minio-client-complete-guide"
          target="_blank"
        >
          如何使用 MinIO？
        </Button>
      </FormItem>
    </div>

    <DialogFooter class="p-1">
      <Button type="submit">
        保存配置
      </Button>
    </DialogFooter>
  </Form>
</template>
