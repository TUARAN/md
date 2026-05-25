<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup'
import { Field, Form } from 'vee-validate'
import * as yup from 'yup'
import { secureStore } from '@/utils/secureStore'
import { toast } from '@/utils/toast'

const schema = toTypedSchema(yup.object({
  accessKeyId: yup.string().required(`AccessKey ID 不能为空`),
  accessKeySecret: yup.string().required(`AccessKey Secret 不能为空`),
  bucket: yup.string().required(`Bucket 不能为空`),
  region: yup.string().required(`Region 不能为空`),
  useSSL: yup.boolean().required(),
  cdnHost: yup.string().optional(),
  path: yup.string().optional(),
}))

const config = secureStore.reactiveJSON(`aliOSSConfig`, {
  accessKeyId: ``,
  accessKeySecret: ``,
  bucket: ``,
  region: ``,
  useSSL: true,
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
      <Field v-slot="{ field, errorMessage }" name="accessKeyId">
        <FormItem label="AccessKey ID" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：LTAI4GdoocsmdoxUf13ylbaNHk" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="accessKeySecret">
        <FormItem label="AccessKey Secret" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" type="password" placeholder="如：cc1d0c142doocs0902bd2d7md4b14da6ylbabc46" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="bucket">
        <FormItem label="Bucket" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：doocs" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="region">
        <FormItem label="Bucket 所在区域" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：oss-cn-shenzhen" />
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

      <Field v-slot="{ field, errorMessage }" name="cdnHost">
        <FormItem label="自定义 CDN 域名" :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：https://imagecdn.alidaodao.com，可不填" />
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
          href="https://help.aliyun.com/document_detail/31883.html"
          target="_blank"
        >
          如何使用阿里云 OSS？
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
