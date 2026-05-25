<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup'
import { Field, Form } from 'vee-validate'
import * as yup from 'yup'
import { secureStore } from '@/utils/secureStore'
import { toast } from '@/utils/toast'

const schema = toTypedSchema(yup.object({
  secretId: yup.string().required(`Secret ID 不能为空`),
  secretKey: yup.string().required(`Secret Key 不能为空`),
  bucket: yup.string().required(`Bucket 不能为空`),
  region: yup.string().required(`Region 不能为空`),
  cdnHost: yup.string().optional(),
  path: yup.string().optional(),
}))

const config = secureStore.reactiveJSON(`txCOSConfig`, {
  secretId: ``,
  secretKey: ``,
  bucket: ``,
  region: ``,
  cdnHost: ``,
  path: ``,
})

async function onSubmit(values: Record<string, unknown>) {
  Object.assign(config.value, values)
  toast.success(`保存成功`)
}
</script>

<template>
  <Form :validation-schema="schema" :initial-values="config" class="flex flex-col flex-1 overflow-hidden" @submit="onSubmit">
    <div class="flex-1 overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <Field v-slot="{ field, errorMessage }" name="secretId">
        <FormItem label="SecretId" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：AKIDnQp1w3DOOCSs8F5MDp9tdoocsmdUPonW3" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="secretKey">
        <FormItem label="SecretKey" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" type="password" placeholder="如：ukLmdtEJ9271f3DOocsMDsCXdS3YlbW0" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="bucket">
        <FormItem label="Bucket" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：doocs-3212520134" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="region">
        <FormItem label="Bucket 所在区域" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：ap-guangzhou" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="cdnHost">
        <FormItem label="自定义 CDN 域名" :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：https://imagecdn.alidaodao.com，可不填" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="path">
        <FormItem label="存储路径" :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：img，可不填，默认根目录" />
        </FormItem>
      </Field>

      <FormItem>
        <Button
          variant="link"
          class="p-0 h-auto text-left whitespace-normal"
          as="a"
          href="https://cloud.tencent.com/document/product/436/38484"
          target="_blank"
        >
          如何使用腾讯云 COS？
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
