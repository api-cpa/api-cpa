module BackOffice
  class ModuleTestersController < BackOfficeController

    before_action :load_request, except: [:index, :new, :create]

    def index
      @collection = Tester::Request.template.order(updated_at: :desc)
    end

    def new
      #name = params.fetch(:tester_request, {}).fetch(:name, '')
      @request = Tester::Requests::Template.new()
    end

    def create
      @request = Tester::Requests::Template.new(requests_params)
      @request.user = current_user

      if @request.save
        @current_request = @request
        respond_to do |format|
          format.html { redirect_to_show }
          format.js { render :new }
        end
      else
        render :new
      end
    end

    def update
      current_request.assign_attributes(requests_params)
      current_request.user = current_user

      if current_request.save
        respond_to do |format|
          format.html { redirect_to_show }
          format.js { render :show }
        end
      else
        render :edit
      end
    end

    def destroy
      redirect_to back_office_module_testers_path
    end

    def edit
    end

    def redirect_to_show
      redirect_to back_office_module_tester_path(current_request)
    end

    def current_request
      @current_request
    end

    private

    def requests_params
      params
          .require(:tester_request)
          .permit(
              :name,
              :method,
              :format,
              :body,
              {tester_parameters_headers_attributes: [:id, :type, :name, :value, :_destroy]},
              {tester_parameters_queries_attributes: [:id, :type, :name, :value, :_destroy]}
          )
    end

    def load_request
      @current_request = Tester::Request.template.includes(:tester_parameters_headers).find(params[:id])
    end

  end
end
