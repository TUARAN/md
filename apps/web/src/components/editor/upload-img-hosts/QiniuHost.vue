<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup'
import { Field, Form } from 'vee-validate'
import * as yup from 'yup'
import { secureStore } from '@/utils/secureStore'
import { toast } from '@/utils/toast'

const schema = toTypedSchema(yup.object({
  accessKey: yup.string().required(`AccessKey 不能为空`),
  secretKey: yup.string().required(`SecretKey 不能为空`),
  bucket: yup.string().required(`Bucket 不能为空`),
  domain: yup.string().required(`Bucket 对应域名不能为空`),
  region: yup.string().optional(),
  path: yup.string().optional(),
}))

const config = secureStore.reactiveJSON(`qiniuConfig`, {
  accessKey: ``,
  secretKey: ``,
  bucket: ``,
  domain: ``,
  region: ``,
  path: ``,
})

async function onSubmit(values: any) {
  Object.assign(config.value, values)
  toast.success(`保存成功`)
}
</script>

<template>
  <Form :validation-schema="schema" :initial-values="config" class="flex flex-col flex-1 overflow-hidden" @submit="onSubmit">
    <div class="flex-1 overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <Field v-slot="{ field, errorMessage }" name="accessKey">
        <FormItem label="AccessKey" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：6DD3VaLJ_SQgOdoocsyTV_YWaDmdnL2n8EGx7kG" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="secretKey">
        <FormItem label="SecretKey" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" type="password" placeholder="如：qgZa5qrvDOOcsmdKStD1oCjZ9nB7MDvJUs_34SIm" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="bucket">
        <FormItem label="Bucket" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：md" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="domain">
        <FormItem label="Bucket 对应域名" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：https://images.123ylb.cn" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="region">
        <FormItem label="存储区域" :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：z2，可不填" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="path">
        <FormItem label="存储路径" :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：img，可不填，默认为根目录" />
        </FormItem>
      </Field>

      <FormItem>
        <Button
          variant="link"
          class="p-0 h-auto text-left whitespace-normal"
          as="a"
          href="https://developer.qiniu.com/kodo"
          target="_blank"
        >
          如何使用七牛云 Kodo？
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
