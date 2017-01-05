module Api
  module V1
    class RoutesController < ApiController
      before_action :authenticate_request!
      before_action :load_proxy_and_authorize
      before_action :load_route_and_authorize

      # allow proxy functionality
      include RedisStoreConcern
      include ProxifyConcern

      def process_request
        begin
          res = proxy_request
          render status: res.code, plain: res.body
        rescue ProxyInitializationError
          render plain: 'ProxyInitializationError'
        rescue ProxyAuthenticationError
          render plain: 'ProxyAuthenticationError'
        rescue ProxyRequestError => e
          render status: :bad_gateway, json: {error: {code: e.code, body: e.body}}
        end
      end

      def load_proxy_and_authorize
        if current_proxy.nil?
          return head :not_found
        end
        if current_service.id != current_proxy.service.id && !(current_service.has_role?(:get, current_proxy) || current_service.has_role?(:get, current_proxy.service))
          return head :forbidden
        end
      end

      def load_route_and_authorize
        if current_route.nil?
          return head :not_found
        end
        if current_service.id != current_route.proxy.service.id && !(current_service.has_role?(:get, current_route) || current_service.has_role?(:get, current_route.proxy.service))
          return head :forbidden
        end
      end

      def current_proxy
        @current_proxy ||= Proxy.find_by_id(params[:proxy_id])
      end

      def current_route
        @current_route ||= current_proxy.routes.find_by_id(params[:id])
      end
    end
  end
end