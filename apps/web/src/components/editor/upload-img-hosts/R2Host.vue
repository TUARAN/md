<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup'
import { Field, Form } from 'vee-validate'
import * as yup from 'yup'
import { secureStore } from '@/utils/secureStore'
import { toast } from '@/utils/toast'

const schema = toTypedSchema(yup.object({
  accountId: yup.string().required(`Account ID 不能为空`),
  accessKey: yup.string().required(`AccessKey 不能为空`),
  secretKey: yup.string().required(`SecretKey 不能为空`),
  bucket: yup.string().required(`Bucket 不能为空`),
  domain: yup.string().required(`Bucket 对应域名不能为空`),
  path: yup.string().optional(),
}))

const config = secureStore.reactiveJSON(`r2Config`, {
  accountId: ``,
  accessKey: ``,
  secretKey: ``,
  bucket: ``,
  domain: ``,
  path: ``,
})

async function onSubmit(values: typeof config.value) {
  Object.assign(config.value, values)
  toast.success(`保存成功`)
}
</script>

<template>
  <Form :validation-schema="schema" :initial-values="config" class="flex flex-col flex-1 overflow-hidden" @submit="onSubmit">
    <div class="flex-1 overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <Field v-slot="{ field, errorMessage }" name="accountId">
        <FormItem label="AccountId" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如: 0030f123e55a57546f4c281c564e560" class="w-full min-w-0 md:min-w-[350px]" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="accessKey">
        <FormItem label="AccessKey" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如: 358090b3a12824a6b0787gae7ad0fc72" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="secretKey">
        <FormItem label="SecretKey" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" type="password" placeholder="如: c1c4dbcb0b6b785ac6633422a06dff3dac055fe74fe40xj1b5c5fcf1bf128010" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="bucket">
        <FormItem label="Bucket" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：md" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="domain">
        <FormItem label="域名" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：https://oss.example.com" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="path">
        <FormItem label="存储路径" :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：img，可不填，默认为根目录" />
        </FormItem>
      </Field>

      <FormItem>
        <div class="flex flex-col items-start">
          <Button
            variant="link"
            class="p-0 h-auto text-left whitespace-normal"
            as="a"
            href="https://developers.cloudflare.com/r2/api/s3/api/"
            target="_blank"
          >
            如何使用 S3 API 操作 Cloudflare R2？
          </Button>
          <Button
            variant="link"
            class="p-0 h-auto text-left whitespace-normal"
            as="a"
            href="https://developers.cloudflare.com/r2/buckets/cors/"
            target="_blank"
          >
            如何设置跨域(CORS)？
          </Button>
        </div>
      </FormItem>
    </div>

    <DialogFooter class="p-1">
      <Button type="submit">
        保存配置
      </Button>
    </DialogFooter>
  </Form>
</template>
