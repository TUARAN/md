<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup'
import { Field, Form } from 'vee-validate'
import * as yup from 'yup'
import { secureStore } from '@/utils/secureStore'
import { toast } from '@/utils/toast'

const schema = toTypedSchema(
  yup.object({
    cloudName: yup.string().required(`Cloud Name 不能为空`),
    apiKey: yup.string().required(`API Key 不能为空`),
    apiSecret: yup.string().optional(),
    uploadPreset: yup.string().when(`apiSecret`, {
      is: (v: string | undefined) => !v || v.length === 0,
      then: s => s.required(`未填写 apiSecret 时必须提供上传预设名`),
      otherwise: s => s.optional(),
    }),
    folder: yup.string().optional(),
    domain: yup.string().optional(),
  }),
)

const config = secureStore.reactiveJSON(`cloudinaryConfig`, {
  cloudName: ``,
  apiKey: ``,
  apiSecret: ``,
  uploadPreset: ``,
  folder: ``,
  domain: ``,
})

async function onSubmit(values: typeof config.value) {
  Object.assign(config.value, values)
  toast.success(`保存成功`)
}
</script>

<template>
  <Form
    :validation-schema="schema"
    :initial-values="config"
    class="flex flex-col flex-1 overflow-hidden"
    @submit="onSubmit"
  >
    <div class="flex-1 overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <Field v-slot="{ field, errorMessage }" name="cloudName">
        <FormItem label="Cloud Name" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：demo" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="apiKey">
        <FormItem label="API Key" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：1234567890" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="apiSecret">
        <FormItem label="API Secret" :error="errorMessage">
          <Input v-bind="field" v-model="field.value" type="password" placeholder="用于签名上传，可不填" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="uploadPreset">
        <FormItem label="Upload Preset" :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="unsigned 时必填，signed 时可不填" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="folder">
        <FormItem label="Folder" :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：blog/image，可不填" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="domain">
        <FormItem label="自定义域名 / CDN" :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：https://cdn.example.com，可不填" />
        </FormItem>
      </Field>

      <FormItem>
        <Button
          variant="link"
          class="p-0 h-auto text-left whitespace-normal"
          as="a"
          href="https://cloudinary.com/documentation/upload_images"
          target="_blank"
        >
          Cloudinary 使用文档
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
