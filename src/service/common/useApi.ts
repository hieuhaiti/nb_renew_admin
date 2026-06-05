import { useEffect } from 'react'
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useLoadingStore } from '@/stores/common/useLoadingStore'
import { apiClient } from '@/service'

type QueryFn<T> = () => Promise<T>

export function useApiQuery<T = any>(
  key: string | readonly unknown[],
  queryFn: QueryFn<T>,
  options: Omit<Parameters<typeof useQuery>[0], 'queryKey' | 'queryFn'> = {},
  loading = true,
  notification = true
) {
  const navigate = useNavigate()
  const setLoading = useLoadingStore((s: any) => s.setLoading)

  const query = useQuery<T>({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn,
    retry: false,
    staleTime: 60_000,        // default 1 min — override per-call: 0 (hot), 5*60_000 (ref data)
    refetchOnWindowFocus: false,
    ...(options as any),
  })

  useEffect(() => {
    if (loading) setLoading(query.isLoading || query.isFetching)
    else setLoading(false)
  }, [query.isLoading, query.isFetching, loading, setLoading])

  useEffect(() => {
    if (notification && query.isSuccess && query.data && (query.data as any).message) {
      const msg = (query.data as any).message
      toast.success(msg)
    }
  }, [notification, query.isSuccess, query.data])

  useEffect(() => {
    if (!query.error) return
    const err: any = query.error
    if (err?.meta?.suppressGlobalError) return

    const status = err?.status || err?.body?.status || err?.body?.statusCode

    // Toast đã được hiện bởi handleResponse() trong apiClient
    // Auth endpoints (login/signup/...): 401 = sai mật khẩu → toast đã hiện ở apiClient, không redirect
    // Chỉ xử lý 401 non-auth: clear tokens + navigate login
    if (status === 401 && !err?.isAuthRequest) {
      apiClient.clearTokens()
      toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
      navigate('/login')
    }
  }, [query.error, navigate])

  return query
}

export function useApiMutation<TData = any, TVariables = any, TOnMutateResult = unknown>(
  mutationFn: (body: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData, any, NoInfer<TVariables>, TOnMutateResult> = {},
  notification = true
) {
  const navigate = useNavigate()
  const setLoading = useLoadingStore((s: any) => s.setLoading)

  const mutation = useMutation<TData, any, TVariables, TOnMutateResult>({
    mutationFn,
    ...options,

    onSuccess: (data, variables, onMutateResult, context) => {
      if (notification && (data as any)?.message) {
        toast.success((data as any).message)
      }
      options.onSuccess?.(data, variables, onMutateResult, context)
    },

    onError: (error: any, variables, onMutateResult, context) => {
      const status = error?.status || error?.body?.status || error?.body?.statusCode

      // Toast đã được hiện bởi handleResponse() trong apiClient
      // Auth endpoints (login/signup/...): 401 = sai mật khẩu → toast đã hiện, không redirect
      // Chỉ xử lý 401 non-auth: clear tokens + navigate login
      if (status === 401 && !error?.isAuthRequest) {
        apiClient.clearTokens()
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
        navigate('/login')
        return
      }

      options.onError?.(error, variables, onMutateResult, context)
    },
  })

  useEffect(() => {
    setLoading((mutation as any).isPending)
  }, [(mutation as any).isPending, setLoading])

  return mutation
}

export function useQueryCache() {
  const qc = useQueryClient()

  const getCached = (key: string | readonly unknown[]) =>
    qc.getQueryData(Array.isArray(key) ? key : [key])
  const setCached = (key: string | readonly unknown[], data: any) =>
    qc.setQueryData(Array.isArray(key) ? key : [key], data)
  const removeQuery = (key: string | readonly unknown[]) =>
    qc.removeQueries({ queryKey: Array.isArray(key) ? key : [key] })

  return { getCached, setCached, removeQuery }
}

export default { useApiQuery, useApiMutation, useQueryCache }
